import React from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DataProvider } from "../src/data/context";
import { Shell } from "../src/components/Shell";
import { LockGate } from "../src/components/LockGate";
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <DataProvider>
        <LockGate>
          <Shell>
            <Slot />
          </Shell>
        </LockGate>
      </DataProvider>
    </SafeAreaProvider>
  );
}
