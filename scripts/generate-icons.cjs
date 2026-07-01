/**
 * Generates PNG icon assets from public/favicon.svg using Playwright's
 * already-downloaded Chromium. Run with:
 *   node scripts/generate-icons.cjs
 */
'use strict'

const { chromium } = require('@playwright/test')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

const ROOT = join(__dirname, '..')
const svgContent = readFileSync(join(ROOT, 'public', 'favicon.svg'), 'utf-8')
const svgBase64 = Buffer.from(svgContent).toString('base64')

const ICONS = [
  { size: 16, name: null }, // preview only
  { size: 32, name: null }, // preview only
  { size: 64, name: null }, // preview only
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
]

async function main() {
  const browser = await chromium.launch()

  for (const { size, name } of ICONS) {
    const page = await browser.newPage()
    await page.setViewportSize({ width: size, height: size })

    // Render the SVG in a minimal HTML page, scaled to fill the viewport.
    await page.setContent(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: #F0E8DD; }
  img { width: ${size}px; height: ${size}px; display: block; }
</style>
</head>
<body>
  <img src="data:image/svg+xml;base64,${svgBase64}" width="${size}" height="${size}">
</body>
</html>`)

    const screenshot = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: size, height: size },
      omitBackground: false,
    })

    await page.close()

    if (name) {
      const dest = join(ROOT, 'public', name)
      writeFileSync(dest, screenshot)
      console.log(`  ✓ ${name}  (${size}×${size}px, ${(screenshot.length / 1024).toFixed(1)} kB)`)
    } else {
      console.log(`  ✓ ${size}×${size}px  — preview ok (${(screenshot.length / 1024).toFixed(1)} kB, not saved)`)
    }
  }

  await browser.close()
  console.log('\nAll icons written to public/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
