import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, Text, View, Pressable } from "react-native";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { DataStore } from "../domain/repositories";
import { openStore } from "./store";
import { entityNames, type EntityName } from "../domain/catalog";
const Context = createContext<DataStore | null>(null);
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, retry: 1 } },
});
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<DataStore>();
  const [error, setError] = useState("");
  const init = () => {
    setError("");
    openStore()
      .then(setStore)
      .catch((e) => setError(String(e)));
  };
  useEffect(init, []);
  if (!store)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#101014",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
        }}
      >
        <Text style={{ color: "#c5b4ff", fontSize: 28, fontWeight: "700" }}>
          QuoteFlow
        </Text>
        {error ? (
          <>
            <Text style={{ color: "#ffb5b5" }}>{error}</Text>
            <Pressable onPress={init}>
              <Text style={{ color: "#c5b4ff" }}>Try again</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color="#c5b4ff" />
        )}
      </View>
    );
  return (
    <QueryClientProvider client={client}>
      <Context.Provider value={store}>{children}</Context.Provider>
    </QueryClientProvider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("Data provider missing.");
  return store;
}
export function useData() {
  const store = useStore();
  return useQuery({ queryKey: ["data"], queryFn: () => store.snapshot() });
}
export function useRefresh() {
  const query = useQueryClient();
  return () => query.invalidateQueries({ queryKey: ["data"] });
}
export const blankSnapshot = () =>
  Object.fromEntries(entityNames.map((e) => [e, []])) as Record<
    EntityName,
    never[]
  >;
