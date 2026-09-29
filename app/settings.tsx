import React, { useState } from "react";
import Constants from "expo-constants";
import { Platform, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useData, useRefresh, useStore } from "../src/data/context";
import { defaultMultipliers } from "../src/domain/calculations";
import type { Backup } from "../src/domain/backup";
import {
  chooseBackup,
  createBackup,
  restoreBackup,
  shareText,
} from "../src/services/files";
import {
  hasLock,
  nativeSecurity,
  removeSecret,
  setPin,
  verifyPin,
} from "../src/services/security";
import { useUI } from "../src/state";
import {
  Button,
  Card,
  Confirm,
  Copy,
  Heading,
  Icon,
  Skeleton,
  colors,
  s,
} from "../src/components/ui";
import * as FileSystem from "expo-file-system/legacy";
export default function Settings() {
  const { data } = useData();
  const store = useStore();
  const refresh = useRefresh();
  const router = useRouter();
  const notify = useUI((x) => x.notify);
  const setLocked = useUI((x) => x.setLocked);
  const [backup, setBackup] = useState<Backup | null>(null);
  const [busy, setBusy] = useState(false);
  const [pin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [multipliers, setMultipliers] = useState<Record<string, string>>({});
  if (!data) return <Skeleton />;
  const last = data.settings.find((s) => s.name === "lastBackup");
  const saved = data.settings.find((s) => s.name === "multipliers");
  const config = saved
    ? (JSON.parse(String(saved.value)) as Record<string, number>)
    : defaultMultipliers;
  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
      await refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Copy size={10} color={colors.purple} bold style={{ letterSpacing: 2 }}>
          MAKE YOURSELF AT HOME
        </Copy>
        <Heading>Settings</Heading>
        <Copy color={colors.muted}>A little setup. A smoother workflow.</Copy>
      </View>
      <Card style={{ gap: 18 }}>
        <View style={s.row}>
          <Icon name="shield-checkmark-outline" color={colors.green} />
          <Heading size={20}>Data & Backup</Heading>
        </View>
        <Copy color={colors.muted}>
          Your workspace lives on this device. Keep a copy somewhere safe before
          changing phones or uninstalling.
        </Copy>
        <Copy size={12}>
          Last backup ·{" "}
          {last
            ? new Date(String(last.value)).toLocaleString()
            : "No backup yet"}
        </Copy>
        <Button
          title="Create & export backup"
          icon="download-outline"
          disabled={busy}
          onPress={() =>
            run(async () => {
              await createBackup(store);
              notify("Backup created. Keep the exported file in a safe place.");
            })
          }
        />
        <Button
          title="Import backup"
          secondary
          icon="cloud-upload-outline"
          disabled={busy}
          onPress={() =>
            run(async () => {
              const result = await chooseBackup();
              if (result) setBackup(result);
            })
          }
        />
        <Button
          title="Export pre-restore recovery copy"
          secondary
          small
          disabled={busy}
          onPress={() =>
            run(async () => {
              const content =
                Platform.OS === "web"
                  ? localStorage.getItem("quoteflow-recovery")
                  : await FileSystem.readAsStringAsync(
                      FileSystem.documentDirectory + "quoteflow-recovery.json",
                    );
              if (!content)
                throw new Error(
                  "No recovery copy exists yet. One is created before every restore.",
                );
              await shareText("quoteflow-recovery.json", content);
            })
          }
        />
        <Copy size={11} color={colors.muted}>
          Includes data and imported images. AI keys and PINs are excluded.
          Backups are not encrypted; keep them private.
        </Copy>
      </Card>
      <Card style={{ gap: 16 }}>
        <View style={s.row}>
          <Icon name="lock-closed-outline" color={colors.purple} />
          <Heading size={20}>App lock</Heading>
        </View>
        {nativeSecurity ? (
          <>
            <Copy color={colors.muted}>
              Use device biometrics or a 6–12 digit PIN. The app locks when it
              leaves the foreground.
            </Copy>
            <TextInput
              accessibilityLabel="Current PIN"
              value={currentPin}
              onChangeText={setCurrentPin}
              placeholder="Current PIN (if enabled)"
              placeholderTextColor={colors.muted}
              secureTextEntry
              keyboardType="number-pad"
              style={s.input}
            />
            <TextInput
              accessibilityLabel="New PIN"
              value={pin}
              onChangeText={setNewPin}
              placeholder="New PIN"
              placeholderTextColor={colors.muted}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={12}
              style={s.input}
            />
            <TextInput
              accessibilityLabel="Confirm new PIN"
              value={confirmPin}
              onChangeText={setConfirmPin}
              placeholder="Confirm new PIN"
              placeholderTextColor={colors.muted}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={12}
              style={s.input}
            />
            <Button
              title="Enable / change app lock"
              disabled={busy}
              onPress={() =>
                run(async () => {
                  if ((await hasLock()) && !(await verifyPin(currentPin)))
                    throw new Error("Current PIN is incorrect.");
                  if (pin !== confirmPin)
                    throw new Error("New PINs do not match.");
                  await setPin(pin);
                  setNewPin("");
                  setConfirmPin("");
                  setCurrentPin("");
                  setLocked(true);
                })
              }
            />
            <Button
              title="Disable app lock"
              secondary
              disabled={busy}
              onPress={() =>
                run(async () => {
                  if ((await hasLock()) && !(await verifyPin(currentPin)))
                    throw new Error("Current PIN is incorrect.");
                  await removeSecret("qf-pin");
                  await removeSecret("qf-attempts");
                  setCurrentPin("");
                  notify("App lock disabled.");
                })
              }
            />
          </>
        ) : (
          <Copy color={colors.muted}>
            PIN, biometrics and SecureStore are available in the installed
            Android app.
          </Copy>
        )}
      </Card>
      <Card style={{ gap: 16 }}>
        <Heading size={20}>Estimation preferences</Heading>
        <Copy color={colors.muted}>
          Complexity scales development hours. Manual prices stay untouched.
          Profile defaults apply to new estimates.
        </Copy>
        {Object.keys(defaultMultipliers).map((key) => (
          <View key={key} style={s.between}>
            <Copy size={12}>{key.toLowerCase().replaceAll("_", " ")}</Copy>
            <TextInput
              accessibilityLabel={key + " multiplier"}
              value={multipliers[key] ?? String(config[key])}
              onChangeText={(value) =>
                setMultipliers((prev) => ({ ...prev, [key]: value }))
              }
              keyboardType="decimal-pad"
              style={[s.input, { width: 90 }]}
            />
          </View>
        ))}
        <Button
          title="Save multipliers"
          secondary
          disabled={busy}
          onPress={() =>
            run(async () => {
              const values = Object.fromEntries(
                Object.keys(defaultMultipliers).map((k) => [
                  k,
                  Number(multipliers[k] ?? config[k]),
                ]),
              );
              if (
                Object.values(values).some(
                  (v) => !Number.isFinite(v) || v <= 0 || v > 10,
                )
              )
                throw new Error(
                  "Multipliers must be greater than zero and no more than 10.",
                );
              const now = new Date().toISOString();
              await store.repository("settings").save({
                id: "multipliers",
                name: "multipliers",
                value: JSON.stringify(values),
                createdAt: saved?.createdAt || now,
                updatedAt: now,
              });
              notify("Estimation preferences saved.");
            })
          }
        />
      </Card>
      <Card style={{ gap: 16 }}>
        <Heading size={20}>Optional AI</Heading>
        <Copy color={colors.muted}>
          Connect your own provider key for writing suggestions and CV import.
          Your core workspace always works offline.
        </Copy>
        <Button
          title="Configure writing assistant"
          secondary
          icon="sparkles-outline"
          onPress={() => router.push("/ai")}
        />
      </Card>
      <Copy size={11} color={colors.muted}>
        QuoteFlow {Constants.expoConfig?.version ?? "1.1.0"} · Local-first
        workspace
        {Platform.OS === "web"
          ? "\nBrowser preview uses this browser’s local storage. Android uses SQLite. Export a backup to move between them."
          : "\nApp lock protects access through the interface; the SQLite database is not separately encrypted."}
      </Copy>
      <Confirm
        visible={!!backup}
        title="Restore this workspace?"
        message={
          "Validated backup from " +
          (backup ? new Date(backup.createdAt).toLocaleString() : "") +
          ". This replaces current records. A recovery copy of the current workspace is created first. Export a separate backup before continuing if you need an off-device copy."
        }
        onClose={() => setBackup(null)}
        onConfirm={() => {
          if (!backup) return;
          const value = backup;
          setBackup(null);
          void run(async () => {
            await restoreBackup(store, value);
            notify("Workspace restored successfully.");
          });
        }}
      />
    </View>
  );
}
