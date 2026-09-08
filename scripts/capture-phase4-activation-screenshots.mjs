import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const outDir = resolve(process.cwd(), "docs/phase4-screenshots");
mkdirSync(outDir, { recursive: true });
const base = "http://localhost:3000";

const shots = [
  {
    name: "cohort-activation-cta",
    url: `${base}/studio/fans/cohort/evt_marisol_brooklyn?stage=connected&guided=marisol-artist-studio&step=3`,
    wait: "text=Create drop for this audience",
  },
  {
    name: "prefilled-drop",
    url: `${base}/studio/drops/new?event=evt_marisol_brooklyn&prefill=brooklyn-encore&cohort=connected&guided=marisol-artist-studio&step=5`,
    wait: "text=Who will get access",
  },
  {
    name: "activation-results",
    url: `${base}/studio/drops/drp_brooklyn_encore_activation`,
    wait: "text=Activated revenue",
  },
  {
    name: "guided-step-5",
    url: `${base}/studio/drops/new?event=evt_marisol_brooklyn&prefill=brooklyn-encore&cohort=connected&guided=marisol-artist-studio&step=5`,
    wait: "text=Activate the audience",
  },
  {
    name: "guided-step-6",
    url: `${base}/studio/insights?event=evt_marisol_brooklyn&guided=marisol-artist-studio&step=6`,
    wait: "text=The relationship doesn't",
  },
];

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
        await page.goto(shot.url, { waitUntil: "networkidle", timeout: 45000 });
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
