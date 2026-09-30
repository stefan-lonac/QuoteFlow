import { entityNames, type EntityName, type Row } from "../domain/catalog";
import type { DataStore, Snapshot } from "../domain/repositories";
const key = "quoteflow-browser-v1";
export async function openStore(): Promise<DataStore> {
  const empty = () =>
    Object.fromEntries(entityNames.map((n) => [n, []])) as unknown as Snapshot;
  let state: Snapshot =
    JSON.parse(localStorage.getItem(key) || "null") || empty();
  let inTransaction = false;
  // Add empty collections for existing browser workspaces without resetting data.
  state = { ...empty(), ...state };
  const persist = () => {
    if (!inTransaction) localStorage.setItem(key, JSON.stringify(state));
  };
  const store: DataStore = {
    repository: (entity: EntityName) => ({
      list: async () => [...state[entity]].reverse().map((r) => ({ ...r })),
      get: async (id) => state[entity].find((r) => r.id === id) ?? null,
      save: async (row: Row) => {
        const before = state;
        state = {
          ...state,
          [entity]: [
            ...state[entity].filter((r) => r.id !== row.id),
            { ...row },
          ],
        };
        try {
          persist();
        } catch (e) {
          state = before;
          throw e;
        }
      },
      remove: async (id) => {
        const { fieldsFor } = await import("../domain/catalog");
        for (const name of entityNames)
          for (const f of fieldsFor(name))
            if (f.entity === entity && state[name].some((r) => r[f.key] === id))
              throw new Error(
                "This record is still referenced. Remove its linked records first.",
              );
        const before = state;
        state = {
          ...state,
          [entity]: state[entity].filter((r) => r.id !== id),
        };
        try {
          persist();
        } catch (e) {
          state = before;
          throw e;
        }
      },
    }),
    snapshot: async () => structuredClone(state),
    restore: async (snapshot) => {
      localStorage.setItem(key, JSON.stringify(snapshot));
      state = structuredClone(snapshot);
    },
    transaction: async (work) => {
      const before = structuredClone(state);
      inTransaction = true;
      try {
        await work();
        localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        state = before;
        throw e;
      } finally {
        inTransaction = false;
      }
    },
  };
  return store;
}
