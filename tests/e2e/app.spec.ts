import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_WAV = path.join(__dirname, "fixtures", "test-tone.wav");

test("upload, adjust settings, preview, and export a WAV file", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "音声加工ツール" })).toBeVisible();

  const fileInput = page.locator("#file-input");
  await fileInput.setInputFiles(FIXTURE_WAV);

  await expect(page.locator("#file-info")).toContainText("test-tone.wav");
  await expect(page.locator("#play-button")).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "加工後をWAVで書き出す" }),
  ).toBeEnabled();

  // 周波数帯域を追加
  await page.locator("#band-low").fill("300");
  await page.locator("#band-high").fill("3000");
  await page.getByRole("button", { name: "帯域を追加" }).click();
  await expect(page.locator("#band-list li")).toHaveCount(1);

  // 速度を変更
  await page.locator("#speed-slider").fill("1.5");

  // ピッチ独立モードに切り替え、ピッチも変更
  await page.locator("#pitch-mode-toggle").check();
  await expect(page.locator("#pitch-control")).toBeVisible();
  await page.locator("#pitch-slider").fill("5");

  // 加工後のプレビュー再生
  await page.getByRole("button", { name: "加工後をプレビュー再生" }).click();
  await expect(page.getByRole("button", { name: "停止" })).toBeEnabled();

  // WAVとして書き出し
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "加工後をWAVで書き出す" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("test-tone-edited.wav");
  await expect(page.locator("#export-status")).toContainText(
    "ダウンロードしました",
  );
});
