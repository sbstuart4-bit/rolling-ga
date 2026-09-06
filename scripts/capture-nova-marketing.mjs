import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MKT_BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "public", "marketing");
const eventSlug = "nova-kestrel-gold-hour-nashville-2026";

async function startNovaJourney(page) {
  await page.goto(`${baseUrl}/demo/guided`, { waitUntil: "networkidle", timeout: 90000 });
  const novaForm = page.locator('form:has(input[name="journeyId"][value="nova-nashville"])');
  if ((await novaForm.count()) === 0) throw new Error("Nova form missing");
  await novaForm.locator('button[type="submit"]').click();
  await page.waitForURL(/\/event\//, { timeout: 90000 });
}

async function jumpToStep(page, stepTitle, guidedStep) {
  const stepBtn = page.getByRole("button", { name: stepTitle });
  if ((await stepBtn.count()) === 0) throw new Error(`Step button missing for step ${guidedStep}`);
  await stepBtn.first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
}

async function screenshotFanSurface(page, file) {
  const fanSurface = page.locator(".fan-surface").first();
  await fanSurface.waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(500);
  await fanSurface.screenshot({ path: path.join(outDir, file) });
  console.log(`OK ${file} → ${page.url()}`);
}

async function captureAtStep(page, { stepTitle, file, guidedStep, targetPath }) {
  await startNovaJourney(page);
  await jumpToStep(page, stepTitle, guidedStep);
  if (targetPath) {
    await page.goto(`${baseUrl}${targetPath}?guided=nova-nashville&step=${guidedStep}`, {
      waitUntil: "networkidle",
      timeout: 90000,
    });
  }
  await screenshotFanSurface(page, file);
}

async function captureReceive(page) {
  await startNovaJourney(page);
  await jumpToStep(page, /The fan buys/i, 8);

  const addBtn = page.getByRole("button", { name: /Add to my drop|Add to cart/i });
  if ((await addBtn.count()) === 0) throw new Error("Add to cart button missing at step 8");
  await addBtn.first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  await page.goto(`${baseUrl}/checkout?guided=nova-nashville&step=8`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });

  const confirmBtn = page.getByRole("button", { name: /Get my drop|Confirm order/i });
  if ((await confirmBtn.count()) === 0) throw new Error("Checkout confirm button missing");
  await confirmBtn.first().click();
  await page.waitForURL(/\/order\//, { timeout: 90000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  await screenshotFanSurface(page, "nova-kestrel-receive-mobile.png");
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });

  const captures = [
    {
      stepTitle: /Discover the show/i,
      file: "nova-kestrel-discover-mobile.png",
      guidedStep: 1,
      targetPath: `/event/${eventSlug}`,
    },
    {
      stepTitle: /You arrive at the venue/i,
      file: "nova-kestrel-unlock-mobile.png",
      guidedStep: 5,
      targetPath: `/event/${eventSlug}`,
    },
    {
      stepTitle: /The live moment becomes commerce/i,
      file: "nova-kestrel-shop-mobile.png",
      guidedStep: 7,
      targetPath: `/event/${eventSlug}/shop`,
    },
  ];

  for (const cap of captures) {
    try {
      await captureAtStep(page, cap);
    } catch (err) {
      console.error(`FAIL ${cap.file}:`, err.message);
    }
  }

  // Receive completes a purchase — run after shop so the session stays clean for prior captures.
  try {
    await captureReceive(page);
  } catch (err) {
    console.error("FAIL nova-kestrel-receive-mobile.png:", err.message);
  }

  // Relationship screens — fan relationship section only, not commerce journey.
  const relationshipCaptures = [
    {
      stepTitle: /The show becomes part of the fan's history/i,
      file: "nova-kestrel-credential-mobile.png",
      guidedStep: 9,
      targetPath: `/event/${eventSlug}/credential`,
    },
    {
      stepTitle: /Next time, this fan is known/i,
      file: "nova-kestrel-my-shows-mobile.png",
      guidedStep: 10,
      targetPath: `/shows`,
    },
  ];

  for (const cap of relationshipCaptures) {
    try {
      await captureAtStep(page, cap);
    } catch (err) {
      console.error(`FAIL ${cap.file}:`, err.message);
    }
  }

  await browser.close();
}

main();
