import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { migrate, SCHEMA_VERSION } from "../src/data/schema";
import { entityNames } from "../src/domain/catalog";

test("full restore handles cyclic proposal/project references without data loss", async () => {
  const db = new DatabaseSync(":memory:");
  const a = adapter(db);
  await migrate(a);
  const populate = () =>
    db.exec(
      "INSERT INTO clients (id,createdAt,updatedAt,name) VALUES ('c','now','now','Client'); INSERT INTO projects (id,createdAt,updatedAt,title,currency,clientId) VALUES ('p','now','now','Project','EUR','c'); INSERT INTO estimates (id,createdAt,updatedAt,title,currency,projectId) VALUES ('e','now','now','Estimate','EUR','p'); INSERT INTO proposals (id,createdAt,updatedAt,title,number,clientId,currency,estimateId,projectId) VALUES ('offer','now','now','Offer','Q1','c','EUR','e','p');",
    );
  populate();
  await a.withTransactionAsync(async () => {
    db.exec("PRAGMA defer_foreign_keys=ON");
    for (const name of [...entityNames].reverse())
      db.exec('DELETE FROM "' + name + '"');
    populate();
  });
  assert.equal(
    db.prepare("SELECT projectId FROM proposals").get()!.projectId,
    "p",
  );
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  db.close();
});
function adapter(db: DatabaseSync) {
  return {
    execAsync: async (sql: string) => {
      db.exec(sql);
    },
    getFirstAsync: async <T>(sql: string) =>
      (db.prepare(sql).get() || null) as T | null,
    withTransactionAsync: async (work: () => Promise<void>) => {
      db.exec("BEGIN");
      try {
        await work();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}
test("fresh database creates every table, foreign keys and indexes", async () => {
  const db = new DatabaseSync(":memory:");
  await migrate(adapter(db));
  const names = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r) => r.name);
  for (const name of entityNames) assert.ok(names.includes(name));
  assert.equal(
    db.prepare("PRAGMA user_version").get()!.user_version,
    SCHEMA_VERSION,
  );
  assert.equal(db.prepare("PRAGMA foreign_keys").get()!.foreign_keys, 1);
  assert.throws(() =>
    db.exec(
      "INSERT INTO projects (id,createdAt,updatedAt,title,currency,clientId) VALUES ('p','now','now','Broken','EUR','missing')",
    ),
  );
  db.close();
});
test("re-running migrations retains existing records", async () => {
  const db = new DatabaseSync(":memory:");
  const a = adapter(db);
  await migrate(a);
  db.exec(
    "INSERT INTO clients (id,createdAt,updatedAt,name) VALUES ('client-1','now','now','Original client')",
  );
  await migrate(a);
  assert.equal(
    db.prepare("SELECT name FROM clients").get()!.name,
    "Original client",
  );
  db.close();
});
test("newer databases are refused without modification", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA user_version=99");
  await assert.rejects(migrate(adapter(db)), /newer version/);
  assert.equal(db.prepare("PRAGMA user_version").get()!.user_version, 99);
  db.close();
});
test("a failed migration rolls back schema and version", async () => {
  const db = new DatabaseSync(":memory:");
  const a = adapter(db);
  await assert.rejects(
    migrate({
      ...a,
      execAsync: async (sql) => {
        if (sql.startsWith("PRAGMA user_version ="))
          throw new Error("Simulated disk error");
        await a.execAsync(sql);
      },
    }),
  );
  assert.equal(db.prepare("PRAGMA user_version").get()!.user_version, 0);
  assert.equal(
    db
      .prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table'")
      .get()!.n,
    0,
  );
  db.close();
});
test("restore-style deferred transaction rolls back on broken relationships", async () => {
  const db = new DatabaseSync(":memory:");
  const a = adapter(db);
  await migrate(a);
  db.exec(
    "INSERT INTO clients (id,createdAt,updatedAt,name) VALUES ('old','now','now','Keep me')",
  );
  await assert.rejects(
    a.withTransactionAsync(async () => {
      db.exec(
        "PRAGMA defer_foreign_keys=ON; DELETE FROM clients; INSERT INTO projects (id,createdAt,updatedAt,title,currency,clientId) VALUES ('p','now','now','Broken','EUR','missing')",
      );
    }),
  );
  assert.equal(db.prepare("SELECT name FROM clients").get()!.name, "Keep me");
  db.close();
});
