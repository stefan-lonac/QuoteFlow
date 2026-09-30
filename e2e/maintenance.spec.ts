import { test, expect } from "@playwright/test";
test("client agreement, receipt, revenue and mobile persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/clients?new=1");
  await page
    .getByLabel("Full name", { exact: true })
    .fill("Maintenance Client");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByText("Maintenance Client", { exact: true }),
  ).toBeVisible();
  await page.goto("/maintenanceContracts");
  await page.getByRole("button", { name: "New agreement" }).click();
  await page
    .getByLabel("Agreement name", { exact: true })
    .fill("Monthly website care");
  await page.getByText("Maintenance Client", { exact: true }).last().click();
  await page.getByLabel("Monthly fee", { exact: true }).fill("310");
  await page.getByLabel("Starts on", { exact: true }).fill("2024-01-16");
  await page
    .getByLabel("Last service day (blank = ongoing)", { exact: true })
    .fill("2024-03-10");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("€570.00").first()).toBeVisible();
  await page.getByRole("button", { name: "Record receipt" }).click();
  await page.getByLabel("Amount received", { exact: true }).fill("155");
  await page.getByLabel("Received on", { exact: true }).fill("2024-02-02");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("€155.00 received in total")).toBeVisible();
  await page.reload();
  await expect(page.getByText("€155.00 received in total")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/maintenance-mobile.png",
    fullPage: true,
  });
  await page.goto("/revenue");
  await expect(
    page.getByText("€155.00", { exact: true }).first(),
  ).toBeVisible();
  await page.getByText("Monthly website care", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit details" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
