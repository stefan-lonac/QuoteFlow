import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { makeBackup, validateBackup, type Backup } from "../domain/backup";
import type { DataStore } from "../domain/repositories";
import type { Row } from "../domain/catalog";
export const id = () => Crypto.randomUUID();
export const digest = (text: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
const safeName = (name: string) => name.replace(/[^\w.-]/g, "_");
export async function shareText(name: string, content: string) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(
      new Blob([content], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const uri = FileSystem.documentDirectory + name;
  await FileSystem.writeAsStringAsync(uri, content);
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Export QuoteFlow backup",
    });
}
export async function createBackup(store: DataStore, share = true) {
  const snapshot = await store.snapshot();
  const files: Backup["files"] = [];
  for (const file of snapshot.files) {
    const uri = String(file.uri);
    const base64 =
      Platform.OS === "web"
        ? uri.split(",")[1] || ""
        : await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
    files.push({ id: file.id, name: safeName(String(file.name)), base64 });
  }
  const backup = await makeBackup(snapshot, files, digest);
  const content = JSON.stringify(backup);
  const name = `quoteflow-backup-v2-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  if (share) await shareText(name, content);
  else if (Platform.OS !== "web")
    await FileSystem.writeAsStringAsync(
      FileSystem.documentDirectory + "quoteflow-recovery.json",
      content,
    );
  else localStorage.setItem("quoteflow-recovery", content);
  const now = new Date().toISOString();
  await store.repository("settings").save({
    id: "last-backup",
    name: "lastBackup",
    value: now,
    createdAt: now,
    updatedAt: now,
  });
  return content;
}
export async function chooseBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "application/octet-stream"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0]!;
  if ((asset.size ?? 0) > 100 * 1024 * 1024)
    throw new Error("Backup must be smaller than 100 MB.");
  const content =
    Platform.OS === "web"
      ? await (await fetch(asset.uri)).text()
      : await FileSystem.readAsStringAsync(asset.uri);
  return validateBackup(content, digest);
}
export async function restoreBackup(store: DataStore, backup: Backup) {
  await createBackup(store, false);
  const data = JSON.parse(JSON.stringify(backup.data)) as Backup["data"];
  const paths: string[] = [];
  try {
    for (const attachment of backup.files) {
      const file = data.files.find((f) => f.id === attachment.id)!;
      const previous = String(file.uri);
      const uri =
        Platform.OS === "web"
          ? `data:${file.mimeType};base64,${attachment.base64}`
          : FileSystem.documentDirectory + id() + "-" + attachment.name;
      if (Platform.OS !== "web") {
        await FileSystem.writeAsStringAsync(uri, attachment.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        paths.push(uri);
      }
      file.uri = uri;
      for (const rows of Object.values(data))
        for (const row of rows)
          for (const field of ["featuredImage", "profileImage", "companyLogo"])
            if (row[field] === previous) row[field] = uri;
    }
    await store.restore(data);
  } catch (error) {
    for (const uri of paths)
      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    throw error;
  }
}
export async function selectImage(store: DataStore) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
    base64: Platform.OS === "web",
  });
  if (result.canceled) return null;
  const asset = result.assets[0]!;
  const fileId = id();
  const name = safeName(asset.fileName || "image.jpg");
  const uri =
    Platform.OS === "web"
      ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
      : FileSystem.documentDirectory + fileId + "-" + name;
  if (Platform.OS !== "web")
    await FileSystem.copyAsync({ from: asset.uri, to: uri });
  const now = new Date().toISOString();
  const row: Row = {
    id: fileId,
    name,
    uri,
    mimeType: asset.mimeType || "image/jpeg",
    createdAt: now,
    updatedAt: now,
  };
  await store.repository("files").save(row);
  return uri;
}
