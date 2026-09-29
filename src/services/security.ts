import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { digest, id } from "./files";
export const nativeSecurity = Platform.OS !== "web";
export async function getSecret(key: string) {
  return nativeSecurity ? SecureStore.getItemAsync(key) : null;
}
export async function setSecret(key: string, value: string) {
  if (!nativeSecurity)
    throw new Error("Secure configuration is available in the Android app.");
  await SecureStore.setItemAsync(key, value);
}
export async function removeSecret(key: string) {
  if (nativeSecurity) await SecureStore.deleteItemAsync(key);
}
export async function hasLock() {
  return !!(await getSecret("qf-pin"));
}
export async function setPin(pin: string) {
  if (!/^\d{6,12}$/.test(pin))
    throw new Error("Choose a PIN with 6–12 digits.");
  const salt = id();
  await setSecret(
    "qf-pin",
    JSON.stringify({ salt, hash: await digest(salt + ":" + pin) }),
  );
  await removeSecret("qf-attempts");
}
export async function verifyPin(pin: string) {
  const stored = await getSecret("qf-pin");
  if (!stored) return true;
  const attempts = JSON.parse(
    (await getSecret("qf-attempts")) || '{"count":0,"until":0}',
  ) as { count: number; until: number };
  if (Date.now() < attempts.until)
    throw new Error(
      "Too many attempts. Try again in " +
        Math.ceil((attempts.until - Date.now()) / 1000) +
        " seconds.",
    );
  const data = JSON.parse(stored) as { salt: string; hash: string };
  const valid = (await digest(data.salt + ":" + pin)) === data.hash;
  if (valid) await removeSecret("qf-attempts");
  else
    await setSecret(
      "qf-attempts",
      JSON.stringify({
        count: attempts.count + 1,
        until:
          attempts.count >= 4
            ? Date.now() + Math.min(300000, 30000 * (attempts.count - 3))
            : 0,
      }),
    );
  return valid;
}
export async function biometricUnlock() {
  if (
    !nativeSecurity ||
    !(await LocalAuthentication.hasHardwareAsync()) ||
    !(await LocalAuthentication.isEnrolledAsync())
  )
    throw new Error("Biometrics are unavailable. Use your PIN.");
  return (
    await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock QuoteFlow",
      disableDeviceFallback: true,
      cancelLabel: "Use PIN",
    })
  ).success;
}
