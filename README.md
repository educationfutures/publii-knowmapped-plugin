# KnowMapped Embeds for Publii

The official Publii plugin for embedding public [KnowMapped](https://knowmapped.com/) knowledge maps in posts and pages. Maps are rendered natively in the page—without an iframe—and retain their saved theme, typography, hierarchy, relationships, and responsive layout.

## Requirements

- Publii 0.46.0 or newer
- A public KnowMapped map
- A generated site that can load assets from `https://knowmapped.com` and map data and fonts from `https://app.knowmapped.com`

Private maps are not exposed by the public embed API and cannot be rendered by this plugin.

## Install

1. Download the latest plugin ZIP from this repository's [Releases](../../releases) page.
2. In Publii, open **Tools → Plugins** and install the ZIP.
3. Enable **KnowMapped Embeds** for the site.
4. Add a shortcode to a post or page and regenerate the site.

For local packaging, place `main.js`, `plugin.json`, `thumbnail.svg`, `LICENSE`, and `README.md` in a folder named `knowledgeMapEmbeds`, then ZIP that folder. Do not add the remote viewer JavaScript or stylesheet to `plugin.json`; Publii tries to copy every declared asset during rendering.

## Basic use

Copy the UUID from a map's public KnowMapped URL and use it as the `id`:

```text
[knowmapped id="35d6010c-6707-4d6a-b6d9-241fec5d4a8e"]
```

A seamless, wide presentation can be created with:

```text
[knowmapped id="MAP_UUID" title="hide" width="wide" frame="hide" background="hide" exploration="hide"]
```

## Shortcode options

| Attribute | Values | Default | Purpose |
| --- | --- | --- | --- |
| `id` | Map UUID | Required | Identifies the public KnowMapped map. |
| `title` | `show`, `hide` | Plugin setting | Shows or hides the map title. |
| `title-align` | `left`, `center` | Plugin setting | Aligns a visible map title. |
| `width` | `normal`, `wide`, `full` | Plugin setting | Uses article width, 150% of article width, or browser width. The legacy value `content` behaves as `normal`. |
| `height` | `auto`, or `300`–`1200` | `auto` | Calculates height from map geometry and available width, or applies a fixed desktop height in pixels. |
| `frame` | `show`, `hide` | Plugin setting | Controls the outer border, corners, and shadow. |
| `background` | `show`, `hide` | Plugin setting | Controls the saved canvas surface and grid presentation. |
| `exploration` | `show`, `hide` | Plugin setting | Enables reader panning and zooming or presents a static map. |

Unknown attributes and invalid values are ignored safely. Multiple shortcodes may be used on the same page.

## Responsive and touch behavior

Automatic embeds recalculate their height when the map container or browser size changes, including device rotation. On touch devices, interactive maps initially remain scroll-safe. Readers select **Explore map** before using one-finger panning and map zoom controls, then select **Done** to return to normal page scrolling. Pinch gestures continue to magnify the page.

## How rendering works

The plugin writes a small, validated placeholder into generated HTML only where a valid shortcode appears. It then loads the matching versioned viewer stylesheet and JavaScript from:

- `https://knowmapped.com/embed/v1/knowmapped-embed.css`
- `https://knowmapped.com/embed/v1/knowmapped-embed.js`

The viewer requests public map data from `https://app.knowmapped.com/api/embed/v1/maps/{id}`. Map fonts are self-hosted by KnowMapped and cached by the browser. The page's Content Security Policy must therefore permit the two KnowMapped origins for the applicable script, style, connection, and font directives.

Map titles inherit the publication's typography so the embed feels native to the site. Concepts and relationships use the map's selected typeface. The shared viewer preserves saved theme colors plus theme-specific node geometry and borders, hierarchy weights, relationship lines and labels, grid treatment, relationship strength—including dashed weak relationships—and supported edge routing.

The remote viewer files are intentionally not bundled in this repository. This keeps the Publii package small and avoids Publii's large-plugin-asset limitations while ensuring the renderer and its stylesheet remain matched.

## Troubleshooting

- **The map does not appear:** confirm that the map is public and that the UUID—not the full URL—was copied into `id`.
- **The shortcode remains visible:** confirm the plugin is enabled for the site, then regenerate the site.
- **Fonts, styles, or data are blocked:** review the site's Content Security Policy and allow the KnowMapped origins described above.
- **An old viewer persists:** clear the publication/CDN cache and regenerate the site. Plugin releases use a matched asset version to prevent mixed viewer generations.
- **A wide or full map is constrained:** the publication theme may place overflow restrictions on the article container. Inspect the theme's content wrapper styles.

## Privacy and security

The plugin requests only the public embed representation of the map ID supplied in the shortcode. It does not collect credentials, write cookies, include analytics, or expose private-map data. Public maps remain subject to KnowMapped's [Privacy Policy](https://knowmapped.com/privacy/) and [Terms of Service](https://knowmapped.com/terms/).

Please report security issues privately using the instructions in [SECURITY.md](SECURITY.md). Do not publish sensitive reports in a GitHub issue.

## License

Released under the [MIT License](LICENSE).
