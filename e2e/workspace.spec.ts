import { test, expect } from "@playwright/test";
test("workspace CRUD, estimate, proposal PDF privacy, backup and mobile navigation", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByText("A little clarity. A lot of possibility."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Explore with sample data" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("€10,300.00").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm", exact: true }),
  ).toBeHidden();
  await page.goto("/");
  await expect(page.getByText("€10,300.00").first()).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: "artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  await page.goto("/clients?new=1");
  await page.getByLabel("Full name", { exact: true }).fill("Test Client");
  await page.getByLabel("Company", { exact: true }).fill("Test Studio");
  await page.getByLabel("Email", { exact: true }).fill("client@example.com");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Test Client", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Test Client", { exact: true })).toBeVisible();
  await page.getByLabel("Search clients…").fill("Test Client");
  await expect(page.getByText("Olivia Martin", { exact: true })).toHaveCount(0);
  await page.goto("/estimates?detail=demo-estimate-1");
  await expect(page.getByText("The estimate, explained")).toBeVisible();
  await page.getByRole("button", { name: "Edit details" }).click();
  await page
    .getByLabel("Final price override (blank = calculated)", { exact: true })
    .fill("1234");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("€1,234.00").last()).toBeVisible();
  await page
    .getByRole("button", { name: "Create proposal from estimate" })
    .click();
  await expect(
    page.getByRole("button", { name: "Export client PDF" }),
  ).toBeVisible();
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Export client PDF" }).click();
  const popup = await popupPromise;
  await expect(popup.locator("body")).toContainText("€1,234.00");
  await expect(popup.locator("body")).not.toContainText("Internal estimate");
  await expect(popup.locator("body")).not.toContainText("Base hours");
  await popup.close();
  await page.goto("/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create & export backup" }).click();
  const download = await downloadPromise;
  await download.saveAs(testInfo.outputPath("backup.json"));
  const fs = await import("node:fs/promises");
  const backup = JSON.parse(
    await fs.readFile(testInfo.outputPath("backup.json"), "utf8"),
  );
  expect(backup.version).toBe(2);
  expect(
    backup.data.clients.some((c: { name: string }) => c.name === "Test Client"),
  ).toBe(true);
  await page.goto("/clients?new=1");
  await page.getByLabel("Full name", { exact: true }).fill("After backup");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("After backup", { exact: true })).toBeVisible();
  await page.goto("/settings");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import backup" }).click();
  await (await chooserPromise).setFiles(testInfo.outputPath("backup.json"));
  await expect(page.getByText("Restore this workspace?")).toBeVisible();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByText("Workspace restored successfully."),
  ).toBeVisible();
  await page.goto("/clients");
  await expect(page.getByText("Test Client", { exact: true })).toBeVisible();
  await expect(page.getByText("After backup", { exact: true })).toHaveCount(0);
  await page.goto("/");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByText("A little clarity. A lot of possibility."),
  ).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: "artifacts/dashboard-mobile.png",
    fullPage: true,
  });
  await page.getByText("More", { exact: true }).click();
  await expect(page.getByText("Make space for great work.")).toBeVisible();
  expect(errors).toEqual([]);
});
