import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MKT_BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "acceptance-walkthrough-output", "p11-release-qa");

const routes = [
  { slug: "home", path: "/home" },
  { slug: "how-it-works", path: "/how-it-works" },
  { slug: "for-artists", path: "/for-artists" },
  { slug: "for-fans", path: "/for-fans" },
  { slug: "partners", path: "/partners" },
  { slug: "about", path: "/about" },
  { slug: "pilot", path: "/pilot" },
];

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

  const matrix = [];

  for (const route of routes) {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(1200);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );

      const h1Count = await page.locator("main h1").count();
      const brokenImages = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("main img"));
        return imgs.filter((img) => !img.complete || img.naturalWidth === 0).length;
      });

      if (vp.name === "390x844" || vp.name === "1440x900") {
        const routeDir = path.join(outDir, route.slug);
        await mkdir(routeDir, { recursive: true });
        await page.screenshot({
          path: path.join(routeDir, `${route.slug}-${vp.name}.png`),
          fullPage: true,
        });
      }

      matrix.push(
        `${route.slug}\t${vp.name}\toverflow=${overflow}\th1=${h1Count}\tbrokenImgs=${brokenImages}`,
      );
    }
  }

  // Demo CTA smoke — home hero
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/home`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);
  const demoButton = page.getByRole("button", { name: /Experience the Nova Kestrel Demo/i }).first();
  await demoButton.click();
  await page.waitForTimeout(2000);
  const demoUrl = page.url();
  matrix.push(`demo-entry\thome-hero\turl=${demoUrl}`);

  // Pilot anchor smoke
  await page.goto(`${baseUrl}/home`, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /Pilot with us/i }).first().click();
  await page.waitForTimeout(500);
  matrix.push(`pilot-anchor\thome-hero\thash=${new URL(page.url()).hash}`);

  console.log(matrix.join("\n"));
  await browser.close();
}

main();
