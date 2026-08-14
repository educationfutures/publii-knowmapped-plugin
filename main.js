'use strict';

const SHORTCODE_PATTERN = /\[knowledge-map(?:\s+([^\]]*))?\]/gi;
const ATTRIBUTE_PATTERN = /([a-z][a-z0-9_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|“([^”]*)”|‘([^’]*)’|([^\s"'\u201c\u201d\u2018\u2019=<>`]+))/gi;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMBED_MARKER = 'data-knowledge-map-embed="true"';
const ASSET_MARKER = 'data-knowledge-map-assets="true"';
const ASSET_VERSION = '1.11.15';
const PUBLIC_SITE_URL = 'https://app.knowmapped.com';
const VIEWER_BASE_URL = 'https://knowmapped.com/embed/v1';
const WIDTHS = new Set(['normal', 'wide', 'full']);
const TITLE_ALIGNMENTS = new Set(['left', 'center']);
const MIN_HEIGHT = 300;
const MAX_HEIGHT = 1200;

class KnowledgeMapEmbedsPlugin {
    constructor(API, name, config) {
        this.API = API;
        this.name = name;
        this.config = config || {};
    }

    addInsertions() {
        this.API.addModifier('postText', this.processContent, 1, this);
        this.API.addModifier('pageText', this.processContent, 1, this);
        this.API.addModifier('htmlOutput', this.injectAssets, 100, this);
    }

    processContent(rendererInstance, text) {
        if (typeof text !== 'string' || !text.toLowerCase().includes('[knowledge-map')) {
            return text;
        }

        const unwrapped = text.replace(
            /<p(?:\s[^>]*)?>\s*(\[knowledge-map(?:\s+[^\]]*)?\])\s*<\/p>/gi,
            '$1'
        );
        return unwrapped.replace(SHORTCODE_PATTERN, (shortcode, rawAttributes) => {
            return this.renderPlaceholder(this.parseAttributes(rawAttributes || ''));
        });
    }

    parseAttributes(source) {
        const attributes = {};
        let match;
        ATTRIBUTE_PATTERN.lastIndex = 0;

        while ((match = ATTRIBUTE_PATTERN.exec(source)) !== null) {
            const name = match[1].toLowerCase();
            if (!['id', 'title', 'title-align', 'width', 'height', 'frame', 'background', 'exploration'].includes(name) ||
                Object.prototype.hasOwnProperty.call(attributes, name)) {
                continue;
            }
            const value = match.slice(2).find((candidate) => typeof candidate === 'string');
            attributes[name] = String(value)
                .replace(/&amp;/gi, '&')
                .replace(/&#0*38;/gi, '&')
                .replace(/&#x0*26;/gi, '&');
        }
        return attributes;
    }

    validBoolean(value, configuredDefault, fallback) {
        const normalize = (candidate) => {
            if (typeof candidate === 'boolean') return candidate;
            const normalized = String(candidate || '').trim().toLowerCase();
            if (['show', 'true', '1', 'yes', 'on'].includes(normalized)) return true;
            if (['hide', 'false', '0', 'no', 'off'].includes(normalized)) return false;
            return null;
        };
        return normalize(value) ?? normalize(configuredDefault) ?? fallback;
    }

    validHeight(value) {
        const normalized = String(value || '').trim().toLowerCase();
        if (!normalized || normalized === 'auto') {
            return { mode: 'auto', height: null };
        }
        const parsed = Number.parseInt(value, 10);
        if (Number.isInteger(parsed) && parsed >= MIN_HEIGHT && parsed <= MAX_HEIGHT) {
            return { mode: 'fixed', height: parsed };
        }
        return { mode: 'auto', height: null };
    }

    validWidth(value) {
        const normalize = (candidate) => {
            const normalized = String(candidate || '').trim().toLowerCase();
            return normalized === 'content' ? 'normal' : normalized;
        };
        const configured = normalize(this.config.defaultWidth);
        const fallback = WIDTHS.has(configured) ? configured : 'normal';
        const normalized = normalize(value);
        return WIDTHS.has(normalized) ? normalized : fallback;
    }

    validTitleAlignment(value) {
        const configured = String(this.config.defaultTitleAlignment || '').toLowerCase();
        const fallback = TITLE_ALIGNMENTS.has(configured) ? configured : 'left';
        const normalized = String(value || '').toLowerCase();
        return TITLE_ALIGNMENTS.has(normalized) ? normalized : fallback;
    }

    renderPlaceholder(attributes) {
        const id = String(attributes.id || '').trim().toLowerCase();
        if (!UUID_PATTERN.test(id)) {
            return '<div class="knowledge-map-embed knowledge-map-embed__error" role="alert">Knowledge map: enter a valid map ID.</div>';
        }

        const width = this.validWidth(attributes.width);
        const height = this.validHeight(attributes.height);
        const showTitle = this.validBoolean(attributes.title, this.config.defaultShowTitle, true);
        const titleAlignment = this.validTitleAlignment(attributes['title-align']);
        const showFrame = this.validBoolean(attributes.frame, this.config.defaultShowFrame, true);
        const showBackground = this.validBoolean(attributes.background, this.config.defaultShowBackground, true);
        const exploration = this.validBoolean(attributes.exploration, this.config.defaultAllowExploration, true);
        const frameClass = showFrame ? '' : ' knowledge-map-embed--frameless';
        const titleClass = ` knowledge-map-embed--title-${titleAlignment}`;
        const heightStyle = height.mode === 'fixed' ? ` style="height:${height.height}px"` : '';
        return `<div class="knowledge-map-embed knowledge-map-embed--${width}${frameClass}${titleClass}" ${EMBED_MARKER} data-map-id="${id}" data-api-base="${PUBLIC_SITE_URL}" data-show-title="${showTitle}" data-show-frame="${showFrame}" data-show-background="${showBackground}" data-width="${width}" data-height-mode="${height.mode}" data-exploration="${exploration}"${heightStyle}><p class="knowledge-map-embed__status" role="status">Loading knowledge map…</p><noscript><a href="${PUBLIC_SITE_URL}/public/${id}">Open this knowledge map</a></noscript></div>`;
    }

    injectAssets(rendererInstance, html) {
        if (typeof html !== 'string' || !html.includes(EMBED_MARKER) || html.includes(ASSET_MARKER)) {
            return html;
        }

        const css = `<link rel="stylesheet" ${ASSET_MARKER} data-knowmapped-embed-v1-style="true" href="${VIEWER_BASE_URL}/knowmapped-embed.css?v=${ASSET_VERSION}">`;
        const script = `<script type="module" src="${VIEWER_BASE_URL}/knowmapped-embed.js?v=${ASSET_VERSION}"></script>`;
        let output = html;

        if (/<\/head\s*>/i.test(output)) {
            output = output.replace(/<\/head\s*>/i, `${css}</head>`);
        } else {
            output = `${css}${output}`;
        }

        if (/<\/body\s*>/i.test(output)) {
            return output.replace(/<\/body\s*>/i, `${script}</body>`);
        }
        return `${output}${script}`;
    }
}

module.exports = KnowledgeMapEmbedsPlugin;
