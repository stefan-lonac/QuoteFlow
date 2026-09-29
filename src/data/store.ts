import * as SQLite from "expo-sqlite";
import {
  entityNames,
  fieldsFor,
  type EntityName,
  type Row,
} from "../domain/catalog";
import type { DataStore, Repository, Snapshot } from "../domain/repositories";
import { migrate } from "./schema";
export class SQLiteRepository implements Repository {
  constructor(
    private db: SQLite.SQLiteDatabase,
    private entity: EntityName,
  ) {}
  list() {
    return this.db.getAllAsync<Row>(
      `SELECT * FROM "${this.entity}" ORDER BY createdAt DESC`,
    );
  }
  get(id: string) {
    return this.db.getFirstAsync<Row>(
      `SELECT * FROM "${this.entity}" WHERE id = ?`,
      id,
    );
  }
  async save(row: Row) {
    const keys = [
      "id",
      "createdAt",
      "updatedAt",
      ...fieldsFor(this.entity).map((f) => f.key),
    ];
    await this.db.runAsync(
      `INSERT INTO "${this.entity}" (${keys.map((k) => `"${k}"`).join(",")}) VALUES (${keys.map(() => "?").join(",")}) ON CONFLICT(id) DO UPDATE SET ${keys
        .slice(1)
        .map((k) => `"${k}"=excluded."${k}"`)
        .join(",")}`,
      ...keys.map((k) => row[k] ?? null),
    );
  }
  async remove(id: string) {
    await this.db.runAsync(`DELETE FROM "${this.entity}" WHERE id = ?`, id);
  }
}
export class SQLiteClientRepository extends SQLiteRepository {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, "clients");
  }
}
export class SQLiteProjectRepository extends SQLiteRepository {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, "projects");
  }
}
export class SQLiteEstimateRepository extends SQLiteRepository {
  constructor(db: SQLite.SQLiteDatabase) {
    super(db, "estimates");
  }
}
export async function openStore(): Promise<DataStore> {
  const db = await SQLite.openDatabaseAsync("quoteflow.db");
  await migrate(db);
  return {
    repository: (entity) => new SQLiteRepository(db, entity),
    transaction: (work) => db.withTransactionAsync(work),
    async snapshot() {
      const result = {} as Snapshot;
      await db.withTransactionAsync(async () => {
        for (const entity of entityNames)
          result[entity] = await new SQLiteRepository(db, entity).list();
      });
      return result;
    },
    async restore(snapshot) {
      await db.withTransactionAsync(async () => {
        await db.execAsync("PRAGMA defer_foreign_keys = ON");
        for (const entity of [...entityNames].reverse())
          await db.execAsync(`DELETE FROM "${entity}"`);
        for (const entity of entityNames)
          for (const row of snapshot[entity])
            await new SQLiteRepository(db, entity).save(row);
      });
    },
  };
}
