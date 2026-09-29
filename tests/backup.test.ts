import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  makeBackup,
  validateBackup,
  payload,
  type Backup,
} from "../src/domain/backup";
import { entityNames, initialValues } from "../src/domain/catalog";
import { formSchema, valuesToRow } from "../src/domain/validation";
import type { Snapshot } from "../src/domain/repositories";
const digest = async (s: string) =>
  createHash("sha256").update(s).digest("hex");
const empty = () =>
  Object.fromEntries(entityNames.map((n) => [n, []])) as unknown as Snapshot;
async function signed(b: Backup) {
  b.checksum = await digest(payload(b));
  return JSON.stringify(b);
}
test("versioned backup round trips every table", async () => {
  const data = empty();
  data.clients.push(
    valuesToRow(
      "clients",
      { ...initialValues("clients"), name: "Client" },
      "c",
    ),
  );
  const b = await makeBackup(data, [], digest);
  assert.deepEqual(
    (await validateBackup(JSON.stringify(b), digest)).data,
    data,
  );
});
test("modified payload, unsupported version and malformed input are rejected", async () => {
  const b = await makeBackup(empty(), [], digest);
  await assert.rejects(validateBackup("{", digest));
  await assert.rejects(
    validateBackup(JSON.stringify({ ...b, version: 2 }), digest),
    /Unsupported/,
  );
  b.createdAt = "tampered";
  await assert.rejects(validateBackup(JSON.stringify(b), digest), /integrity/);
});
test("duplicate IDs, missing tables and dangling foreign keys are rejected even with valid checksum", async () => {
  const data = empty();
  const c = valuesToRow("clients", { name: "Client" }, "c");
  data.clients = [c, c];
  let b = await makeBackup(data, [], digest);
  await assert.rejects(
    validateBackup(JSON.stringify(b), digest),
    /Invalid record/,
  );
  data.clients = [];
  data.projects = [
    valuesToRow(
      "projects",
      { ...initialValues("projects"), title: "Project", clientId: "missing" },
      "p",
    ),
  ];
  b = await makeBackup(data, [], digest);
  await assert.rejects(
    validateBackup(JSON.stringify(b), digest),
    /Broken relationship/,
  );
  const raw = b as unknown as { data: Record<string, unknown> };
  delete raw.data.projects;
  await assert.rejects(
    validateBackup(await signed(b), digest),
    /Missing table/,
  );
});
test("invalid numbers and malformed estimation settings cannot enter the app through backup", async () => {
  const data = empty();
  data.estimates = [
    valuesToRow(
      "estimates",
      { ...initialValues("estimates"), title: "Estimate", hourlyRate: "-2" },
      "e",
    ),
  ];
  await assert.rejects(
    validateBackup(JSON.stringify(await makeBackup(data, [], digest)), digest),
    /Invalid estimates/,
  );
  data.estimates = [];
  data.settings = [
    {
      id: "m",
      name: "multipliers",
      value: '{"STANDARD":0}',
      createdAt: "now",
      updatedAt: "now",
    },
  ];
  await assert.rejects(
    validateBackup(JSON.stringify(await makeBackup(data, [], digest)), digest),
    /Invalid estimation/,
  );
});
test("attachments must be complete and paths cannot escape restore directory", async () => {
  const data = empty();
  data.files = [
    {
      id: "f",
      name: "image.png",
      uri: "file:///old/image.png",
      mimeType: "image/png",
      createdAt: "now",
      updatedAt: "now",
    },
  ];
  await assert.rejects(
    validateBackup(JSON.stringify(await makeBackup(data, [], digest)), digest),
    /missing an attachment/,
  );
  await assert.rejects(
    validateBackup(
      JSON.stringify(
        await makeBackup(
          data,
          [{ id: "f", name: "../escape.png", base64: "AA==" }],
          digest,
        ),
      ),
      digest,
    ),
    /Invalid file/,
  );
  const b = await makeBackup(
    data,
    [{ id: "f", name: "image.png", base64: "AA==" }],
    digest,
  );
  assert.equal(
    (await validateBackup(JSON.stringify(b), digest)).files.length,
    1,
  );
});
test("forms enforce hour bounds, real dates and payment bounds", () => {
  assert.equal(
    formSchema("estimateItems").safeParse({
      ...initialValues("estimateItems"),
      estimateId: "e",
      title: "Item",
      selectedHours: "100",
    }).success,
    false,
  );
  assert.equal(
    formSchema("payments").safeParse({
      ...initialValues("payments"),
      title: "Payment",
      projectId: "p",
      amount: "10",
      paidAmount: "11",
    }).success,
    false,
  );
  assert.equal(
    formSchema("projects").safeParse({
      ...initialValues("projects"),
      title: "Project",
      startDate: "2026-02-30",
    }).success,
    false,
  );
});
