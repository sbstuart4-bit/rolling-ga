import { chromium } from "playwright";
import path from "node:path";

const baseUrl = process.env.MKT_BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "public", "marketing");
const eventSlug = "nova-kestrel-gold-hour-nashville-2026";
const outFile = path.join(outDir, "nova-kestrel-discover-mobile.png");

async function fanHasRendering(page) {
  return page
    .locator(".fan-surface")
    .first()
    .evaluate((el) => /Rendering/i.test(el.textContent ?? ""));
}

async function captureDiscover(page) {
  await page.goto(`${baseUrl}/demo/guided`, { waitUntil: "networkidle", timeout: 90000 });
  await page.locator('form:has(input[name="journeyId"][value="nova-nashville"]) button[type="submit"]').click();
  await page.waitForURL(/\/event\//, { timeout: 90000 });
  await page.getByRole("button", { name: /Discover the show/i }).first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  await page.goto(`${baseUrl}/event/${eventSlug}?guided=nova-nashville&step=1`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });

  const fanSurface = page.locator(".fan-surface").first();
  await fanSurface.waitFor({ state: "visible", timeout: 30000 });

  for (let attempt = 0; attempt < 20; attempt++) {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    if (!(await fanHasRendering(page))) break;
  }

  if (await fanHasRendering(page)) {
    throw new Error("Discover capture still shows Rendering… after settle waits");
  }

  await fanSurface.screenshot({ path: outFile });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });

  try {
    await captureDiscover(page);
    console.log("OK nova-kestrel-discover-mobile.png →", page.url());
  } catch (err) {
    console.error("Capture failed:", err.message);
    process.exitCode = 1;
  }

  await browser.close();
}

main();
