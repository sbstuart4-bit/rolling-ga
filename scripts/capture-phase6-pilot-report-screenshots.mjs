import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "docs/phase6-screenshots");
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";
const brooklynEvent = "evt_marisol_brooklyn";

const shots = [
  {
    name: "guided-step-6-report",
    enterGuided: true,
    path: `/studio/insights?event=${brooklynEvent}&guided=marisol-artist-studio&step=6`,
    wait: "text=The show ends",
  },
  {
    name: "pilot-report-outcome",
    url: `${base}/studio/insights/pilot/${brooklynEvent}`,
    wait: "text=Executive outcome",
  },
  {
    name: "pilot-report-economics",
    url: `${base}/studio/insights/pilot/${brooklynEvent}`,
    wait: "text=Physical vs Rolling GA",
  },
  {
    name: "pilot-report-relationships",
    url: `${base}/studio/insights/pilot/${brooklynEvent}`,
    wait: "text=Relationship story",
  },
  {
    name: "pilot-report-activation",
    url: `${base}/studio/insights/pilot/${brooklynEvent}`,
    wait: "text=Activation story",
  },
  {
    name: "pilot-report-fulfillment",
    url: `${base}/studio/insights/pilot/${brooklynEvent}`,
    wait: "text=Fulfillment story",
  },
  {
    name: "pilot-report-learnings",
    url: `${base}/studio/insights/pilot/${brooklynEvent}`,
    wait: "text=What we learned",
  },
];

function guidedEnterUrl(returnPath) {
  return `${base}/api/demo/enter-guided?returnTo=${encodeURIComponent(returnPath)}`;
}

async function signIn(page) {
  await page.goto(`${base}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', "elena@marisolreyes.example");
  await page.fill('input[name="password"]', "rollingga");
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle", { timeout: 45000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await signIn(page);
      for (const shot of shots) {
        const targetUrl = shot.enterGuided
          ? guidedEnterUrl(shot.path)
          : shot.url;
        await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForSelector(shot.wait, { timeout: 30000 });
        const file = resolve(outDir, `${shot.name}-${width}px.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`Saved ${file}`);
      }
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
