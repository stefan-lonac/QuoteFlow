import { entityNames, fieldsFor, type Row } from "./catalog";
import type { Snapshot } from "./repositories";
import { formSchema } from "./validation";
export type Backup = {
  format: "quoteflow";
  version: 1 | 2;
  createdAt: string;
  data: Snapshot;
  files: { id: string; name: string; base64: string }[];
  checksum: string;
};
export type Digest = (text: string) => Promise<string>;
export const payload = (backup: Omit<Backup, "checksum"> | Backup) =>
  JSON.stringify({
    format: backup.format,
    version: backup.version,
    createdAt: backup.createdAt,
    data: backup.data,
    files: backup.files,
  });
export async function makeBackup(
  data: Snapshot,
  files: Backup["files"],
  digest: Digest,
): Promise<Backup> {
  const backup = {
    format: "quoteflow" as const,
    version: 2 as const,
    createdAt: new Date().toISOString(),
    data,
    files,
  };
  return { ...backup, checksum: await digest(payload(backup)) };
}
export async function validateBackup(
  content: string,
  digest: Digest,
): Promise<Backup> {
  if (content.length > 100 * 1024 * 1024)
    throw new Error("Backup exceeds the 100 MB safety limit.");
  const b = JSON.parse(content) as Backup;
  if (
    b?.format !== "quoteflow" ||
    ![1, 2].includes(b.version) ||
    !b.data ||
    !Array.isArray(b.files) ||
    !b.createdAt ||
    !b.checksum
  )
    throw new Error("Unsupported or invalid QuoteFlow backup.");
  if ((await digest(payload(b))) !== b.checksum)
    throw new Error("Backup integrity check failed. No data was changed.");
  // Authenticate the original payload before upgrading legacy collections.
  if (b.version === 1) {
    b.data.maintenanceContracts ??= [];
    b.data.maintenanceReceipts ??= [];
  }
  for (const entity of entityNames) {
    const rows = b.data[entity];
    if (!Array.isArray(rows)) throw new Error(`Missing table: ${entity}`);
    const ids = new Set<string>();
    for (const row of rows) {
      if (
        !row ||
        typeof row.id !== "string" ||
        !row.id ||
        ids.has(row.id) ||
        typeof row.createdAt !== "string" ||
        typeof row.updatedAt !== "string"
      )
        throw new Error(`Invalid record in ${entity}`);
      ids.add(row.id);
      for (const value of Object.values(row))
        if (
          value !== null &&
          typeof value !== "string" &&
          typeof value !== "number"
        )
          throw new Error("Invalid field type.");
      const result = formSchema(entity).safeParse(
        Object.fromEntries(
          fieldsFor(entity).map((f) => [
            f.key,
            row[f.key] == null ? "" : String(row[f.key]),
          ]),
        ),
      );
      if (!result.success)
        throw new Error(
          `Invalid ${entity} record: ${result.error.issues[0]?.message}`,
        );
    }
  }
  for (const entity of entityNames)
    for (const row of b.data[entity])
      for (const field of fieldsFor(entity))
        if (
          field.entity &&
          row[field.key] &&
          !b.data[field.entity].some((r: Row) => r.id === row[field.key])
        )
          throw new Error(`Broken relationship in ${entity}.`);
  const fileIds = new Set<string>();
  for (const file of b.files) {
    if (
      !file ||
      typeof file.id !== "string" ||
      fileIds.has(file.id) ||
      !/^[\w.-]+$/.test(file.name) ||
      typeof file.base64 !== "string" ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64) ||
      !b.data.files.some((r) => r.id === file.id)
    )
      throw new Error("Invalid file attachment.");
    fileIds.add(file.id);
  }
  for (const file of b.data.files)
    if (!fileIds.has(file.id))
      throw new Error("Backup is missing an attachment.");
  for (const entity of entityNames)
    for (const row of b.data[entity])
      for (const field of fieldsFor(entity))
        if (
          field.type === "image" &&
          row[field.key] &&
          !b.data.files.some((file) => file.uri === row[field.key])
        )
          throw new Error("An image is missing its file reference.");
  const settingsNames = new Set<string>();
  for (const setting of b.data.settings) {
    const name = String(setting.name);
    if (settingsNames.has(name)) throw new Error("Duplicate settings.");
    settingsNames.add(name);
    if (!["multipliers", "lastBackup", "cvNotes"].includes(name))
      throw new Error("Unknown setting in backup.");
    if (name === "multipliers") {
      const values = JSON.parse(String(setting.value)) as Record<
        string,
        unknown
      >;
      if (
        !values ||
        ["SIMPLE", "STANDARD", "COMPLEX", "VERY_COMPLEX"].some(
          (k) =>
            typeof values[k] !== "number" ||
            !Number.isFinite(values[k]) ||
            Number(values[k]) <= 0 ||
            Number(values[k]) > 10,
        )
      )
        throw new Error("Invalid estimation preferences.");
    }
    if (name === "cvNotes") {
      const notes = JSON.parse(String(setting.value));
      if (
        !notes ||
        typeof notes !== "object" ||
        Array.isArray(notes) ||
        Object.values(notes).some((v) => typeof v !== "string")
      )
        throw new Error("Invalid CV notes.");
    }
    if (
      name === "lastBackup" &&
      Number.isNaN(Date.parse(String(setting.value)))
    )
      throw new Error("Invalid backup date.");
  }
  if (b.data.profile.length > 1)
    throw new Error("Backup contains multiple profiles.");
  for (const receipt of b.data.maintenanceReceipts) {
    if (
      b.data.maintenanceContracts.find((r) => r.id === receipt.contractId)
        ?.currency !== receipt.currency
    )
      throw new Error(
        "Maintenance receipt currency does not match its agreement.",
      );
  }
  if (b.version === 1) {
    b.version = 2;
    b.checksum = await digest(payload(b));
  }
  return b;
}
