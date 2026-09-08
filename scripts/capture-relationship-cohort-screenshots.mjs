import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "docs/phase3-screenshots");
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const cohortUrl =
  `${base}/studio/fans/cohort/evt_marisol_brooklyn?guided=marisol-artist-studio&step=3`;

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(`${base}/sign-in`, { waitUntil: "domcontentloaded" });
      await page.fill('input[name="email"]', "elena@marisolreyes.example");
      await page.fill('input[name="password"]', "rollingga");
      await page.click('button[type="submit"]');
      await page.waitForLoadState("networkidle", { timeout: 45000 });
      await page.goto(cohortUrl, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForSelector("text=Relationship funnel", { timeout: 30000 });
      const file = resolve(outDir, `relationship-cohort-${width}px.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`Saved ${file}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
