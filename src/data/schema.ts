import { migration1 } from "./migrations/001";
export const SCHEMA_VERSION = 1;
export const migrations = [{ version: 1, sql: migration1 }];
export async function migrate(db: {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
  withTransactionAsync(work: () => Promise<void>): Promise<void>;
}) {
  await db.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  const current = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  if ((current?.user_version ?? 0) > SCHEMA_VERSION)
    throw new Error("This database needs a newer version of QuoteFlow.");
  for (const migration of migrations)
    if (migration.version > (current?.user_version ?? 0)) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(migration.sql);
        await db.execAsync(`PRAGMA user_version = ${migration.version}`);
      });
    }
}
