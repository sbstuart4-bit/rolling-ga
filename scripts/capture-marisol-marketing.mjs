import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MKT_BASE_URL ?? "http://localhost:3000";
const outDir = path.join(process.cwd(), "public", "marketing");
const eventSlug = "marisol-reyes-a-tender-night-brooklyn-2026";
const journeyId = "marisol-tender-night";
const mktQuery = "mktCapture=1";

function guidedUrl(targetPath, step) {
  const joiner = targetPath.includes("?") ? "&" : "?";
  return `${baseUrl}${targetPath}${joiner}guided=${journeyId}&step=${step}&${mktQuery}`;
}

async function startMarisolJourney(page) {
  await page.goto(`${baseUrl}/demo/guided?${mktQuery}`, { waitUntil: "networkidle", timeout: 90000 });
  const form = page.locator(`form:has(input[name="journeyId"][value="${journeyId}"])`);
  if ((await form.count()) === 0) {
    await page.goto(`${baseUrl}/home`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /See the Artist Demo|Experience the Demo/i }).first().click();
    await page.waitForURL(/\/event\//, { timeout: 90000 });
    return;
  }
  await form.locator('button[type="submit"]').click();
  await page.waitForURL(/\/event\//, { timeout: 90000 });
}

async function assertNoGuidedChrome(page, file) {
  const chrome = page.locator('[aria-label="Guided demo controls"]');
  const count = await chrome.count();
  if (count > 0) {
    throw new Error(`Guided demo chrome still visible for ${file} — restart dev server after mktCapture change`);
  }
}

async function hideDevOverlays(page) {
  await page.request.post(`${baseUrl}/__nextjs_disable_dev_indicator`).catch(() => undefined);
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal, [data-nextjs-dev-tools-button]").forEach((el) => {
      el.remove();
    });
    document.querySelectorAll("[data-issues-count], [data-issues-collapse]").forEach((el) => {
      el.closest("button")?.remove();
    });
    for (const el of document.querySelectorAll("body *")) {
      const text = el.textContent?.trim() ?? "";
      if (/^\d+\s+Issues?$/.test(text) && el.closest("button")) {
        el.closest("button")?.remove();
      }
    }
  });
}

async function screenshotFanSurface(page, file) {
  const fanSurface = page.locator(".fan-surface").first();
  await fanSurface.waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(800);
  await hideDevOverlays(page);
  await assertNoGuidedChrome(page, file);
  await hideDevOverlays(page);
  await page.waitForTimeout(200);
  await fanSurface.screenshot({ path: path.join(outDir, file) });
  console.log(`OK ${file} → ${page.url()}`);
}

async function captureAtStep(page, { file, guidedStep, targetPath }) {
  await page.goto(guidedUrl(targetPath, guidedStep), {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.waitForTimeout(2000);
  await screenshotFanSurface(page, file);
}

async function selectProductSizeIfNeeded(page) {
  const sizeCombo = page.getByRole("combobox", { name: /^Size$/i });
  if ((await sizeCombo.count()) === 0) return;
  await sizeCombo.first().click();
  const option = page.getByRole("option").filter({ hasNotText: /sold out/i }).first();
  await option.waitFor({ state: "visible", timeout: 5000 });
  await option.click();
}

async function captureReceive(page) {
  await startMarisolJourney(page);

  await page.goto(guidedUrl(`/event/${eventSlug}/shop`, 8), {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.waitForTimeout(1500);

  const productLink = page.getByRole("link", { name: /Tender Night Brooklyn Tee|Brooklyn Tee/i });
  if ((await productLink.count()) > 0) {
    await productLink.first().click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  } else {
    await page.goto(
      `${baseUrl}/product/tender-night-brooklyn-tee?e=${eventSlug}&guided=${journeyId}&step=8&${mktQuery}`,
      { waitUntil: "networkidle", timeout: 90000 },
    );
    await page.waitForTimeout(1500);
  }

  await selectProductSizeIfNeeded(page);

  const addBtn = page.getByRole("button", { name: /Add to my drop|Add to cart/i });
  if ((await addBtn.count()) === 0) throw new Error("Add to cart button missing at step 8");
  await addBtn.first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  await page.goto(`${baseUrl}/checkout?guided=${journeyId}&step=8&${mktQuery}`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.waitForTimeout(1000);

  const confirmBtn = page.getByRole("button", { name: /Get my drop|Confirm order/i });
  if ((await confirmBtn.count()) === 0) throw new Error("Checkout confirm button missing");
  await confirmBtn.first().click();
  await page.waitForURL(/\/order\//, { timeout: 90000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  await screenshotFanSurface(page, "marisol-reyes-receive-mobile.png");
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: "mkt-capture",
      value: "1",
      domain: "localhost",
      path: "/",
    },
  ]);
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });

  const captures = [
    {
      file: "marisol-reyes-discover-mobile.png",
      guidedStep: 1,
      targetPath: `/event/${eventSlug}`,
    },
    {
      file: "marisol-reyes-unlock-mobile.png",
      guidedStep: 5,
      targetPath: `/event/${eventSlug}`,
    },
    {
      file: "marisol-reyes-shop-mobile.png",
      guidedStep: 7,
      targetPath: `/event/${eventSlug}/shop`,
    },
  ];

  await startMarisolJourney(page);

  try {
    await captureReceive(page);
  } catch (err) {
    console.error("FAIL marisol-reyes-receive-mobile.png:", err.message);
  }

  for (const cap of captures) {
    try {
      await captureAtStep(page, cap);
    } catch (err) {
      console.error(`FAIL ${cap.file}:`, err.message);
    }
  }

  const relationshipCaptures = [
    {
      file: "marisol-reyes-credential-mobile.png",
      guidedStep: 9,
      targetPath: `/event/${eventSlug}/credential`,
    },
    {
      file: "marisol-reyes-my-shows-mobile.png",
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
