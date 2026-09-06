import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MKT_BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "acceptance-walkthrough-output", "p3-how-it-works-mobile");

const viewports = [
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${baseUrl}/home#how-it-works`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(800);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    const phoneWidth = await page.locator(".mkt-how-it-works-phone").first().evaluate((el) => {
      const parent = el.parentElement;
      const parentWidth = parent?.getBoundingClientRect().width ?? 0;
      const phoneWidth = el.getBoundingClientRect().width;
      return { phoneWidth, parentWidth, ratio: parentWidth ? phoneWidth / parentWidth : 0 };
    });
    const phoneCount = await page.locator(".mkt-how-it-works-phone").count();
    const hasRendering = await page
      .locator(".mkt-how-it-works-phone img")
      .first()
      .evaluate((img) => img.getAttribute("alt")?.includes("Discover") ?? false)
      .then(async (isDiscover) => {
        if (!isDiscover) return false;
        return page.locator('img[alt*="Discover"]').first().evaluate(async (img) => {
          // Check via canvas read of loaded image isn't available; check src loads discover asset
          return img.getAttribute("src")?.includes("discover") ?? false;
        });
      });

    const section = page.locator("#how-it-works");
    await section.scrollIntoViewIfNeeded();
    await section.screenshot({ path: path.join(outDir, `how-it-works-${vp.name}.png`), fullPage: true });

    console.log(
      `${vp.name}: overflow=${overflow} phones=${phoneCount} phoneRatio=${phoneWidth.ratio.toFixed(2)} discoverAsset=${hasRendering}`,
    );
  }

  await browser.close();
}

main();
