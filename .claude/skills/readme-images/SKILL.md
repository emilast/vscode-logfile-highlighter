---
name: readme-images
description: Regenerate the screenshots and GIFs in content/readme/ that README.md shows, with scripts/readme-images. Use when the images may be out of date (a feature's look changed, the highlighting colors changed, a new VS Code version looks different), when a README section needs a new image, or when the user asks to refresh, update or regenerate the README images.
---

# Regenerate the README images

The images in `content/readme/` are generated, never edited by hand. `scripts/readme-images/run.js` starts VS Code with this extension on a virtual X display, with fixed settings (the *Dark Modern* theme, JetBrains Mono 15 px, no menus, tabs or minimap), and `scenes.js` plays one scene per image: it opens a sample log from `scripts/readme-images/samples/`, applies the scene's settings and takes a screenshot or records a GIF.

## Requirements

Linux with Xvfb, ImageMagick, ffmpeg and the JetBrains Mono font. On Ubuntu:

```bash
sudo apt-get install -y xvfb imagemagick ffmpeg fonts-jetbrains-mono
```

On Windows, use WSL. Or run the **README images** GitHub Actions workflow (Actions → README images → Run workflow), which generates the images and uploads them as the `readme-images` artifact.

## Steps

1. Run `npm ci` if `node_modules` is missing. The first run downloads VS Code to `.vscode-test/`.
2. Run all scenes, or only some of them by name:

   ```bash
   npm run readme-images
   npm run readme-images -- overview tail-mode
   ```

   The scenes are `overview`, `time-selection`, `tail-mode`, `ansi-colors`, `custom-patterns`, `theme-colors`, `multiple-styles` and `multiline-pattern`, and each writes `content/readme/<scene>.png` or `.gif`.
3. Look at every image that changed. For a GIF, extract the frames first, since GIFs only store what changed between frames: `convert content/readme/tail-mode.gif -coalesce <folder>/frame-%03d.png`. Check that:
   - The image shows only the editor: no menus, notifications or cursor, and no line cut off at the top, bottom or right.
   - The highlighting shows what the README text next to it describes.
   - The GIFs show the whole action: the selection with the progress bars and the time in the status bar, and the lines being added in tail mode with `Log File Tail Mode` in the status bar.
   - Each GIF is below about 1 MB.
4. Check that every image the README refers to exists: `grep -o 'content/readme/[^)]*' README.md | xargs ls`.
5. Commit the images together with any change to the samples or scenes. An image refresh alone needs no CHANGELOG entry.

## When something looks wrong

- **Lines cut off, or the cursor or other UI visible:** VS Code's layout may have changed. The geometry constants at the top of `scenes.js` (`textLeft`, `textTop`, `charWidth`, `lineHeight`, `statusBarHeight`, `endGap`) are measured from screenshots. Take a full screenshot (`import -window root`) in a scene and measure them again, e.g. the rows of the line numbers with `convert <png> -crop 30x400+35+0 txt:-`.
- **A notification or dialog in the image:** add a setting to `writeUserSettings` in `run.js` that turns it off. `scenes.js` already clears notifications before each image.
- **A different font:** JetBrains Mono is missing. Install it, since the geometry depends on its character width.

## Changing or adding a scene

- Keep the samples realistic and short, at most about 110 characters per line, so that they fit in the image without scrolling.
- The custom pattern settings in `scenes.js` (`customPatterns`, `themeColorPatterns`, `multipleStylesPatterns`, `multilinePatterns`) are also shown as examples in `README.md`. When you change one, change the other.
- A new scene is an entry in the `scenes` object in `scenes.js`. Use `configure()` for its settings (they're restored after the scene), `openSample()` for its log, and `screenshot()` or `recordGif()` for the image. Then reference the image from `README.md` with a relative path, `content/readme/<name>`.
- The images aren't packaged in the extension (`content/readme/**` is in `.vscodeignore`). The Marketplace loads them from GitHub, so they need to be pushed before a release.
