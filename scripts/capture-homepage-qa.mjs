import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MKT_BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "acceptance-walkthrough-output", "p3-homepage");

const viewports = [
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "834x1194", width: 834, height: 1194 },
  { name: "1440x900", width: 1440, height: 900 },
];

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${baseUrl}/home`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(800);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > doc.clientWidth + 1;
    });

    await page.screenshot({
      path: path.join(outDir, `p3-home-${vp.name}.png`),
      fullPage: true,
    });
    console.log(`${vp.name}: overflow=${overflow}`);
  }

  await browser.close();
}

main();
