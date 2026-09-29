import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  TextInput,
  View,
} from "react-native";
import { biometricUnlock, hasLock, verifyPin } from "../services/security";
import { useUI } from "../state";
import { Button, Copy, Heading, Icon, colors, s } from "./ui";
export function LockGate({ children }: { children: React.ReactNode }) {
  const locked = useUI((x) => x.locked);
  const setLocked = useUI((x) => x.setLocked);
  const [ready, setReady] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let mounted = true;
    hasLock()
      .then((value) => {
        if (mounted) {
          setLocked(value);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setLocked(true);
          setReady(true);
          setError(
            "Secure storage could not be read. Restart the app to retry.",
          );
        }
      });
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active")
        void hasLock()
          .then((value) => {
            if (mounted && value) {
              setLocked(true);
              setPin("");
            }
          })
          .catch(() => setLocked(true));
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [setLocked]);
  const unlock = async (bio: boolean) => {
    setBusy(true);
    setError("");
    try {
      if (await (bio ? biometricUnlock() : verifyPin(pin))) {
        setLocked(false);
        setPin("");
      } else {
        setError("Could not unlock. Please try again.");
        setPin("");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  return (
    <>
      <View style={{ flex: 1 }} pointerEvents={locked ? "none" : "auto"}>
        {children}
      </View>
      <Modal visible={locked} animationType="fade" onRequestClose={() => {}}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            alignItems: "center",
            justifyContent: "center",
            padding: 28,
          }}
        >
          <View style={{ width: "100%", maxWidth: 360, gap: 22 }}>
            <Icon name="lock-closed-outline" size={42} color={colors.purple} />
            <Heading>Your space, protected.</Heading>
            <Copy color={colors.muted}>
              Unlock your private QuoteFlow workspace.
            </Copy>
            <TextInput
              accessibilityLabel="PIN"
              placeholder="Enter your PIN"
              placeholderTextColor={colors.muted}
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={12}
              style={s.input}
            />
            <Button
              disabled={busy}
              title="Unlock"
              onPress={() => unlock(false)}
            />
            <Button
              disabled={busy}
              title="Use biometrics"
              secondary
              icon="finger-print-outline"
              onPress={() => unlock(true)}
            />
            {error ? <Copy color={colors.red}>{error}</Copy> : null}
          </View>
        </View>
      </Modal>
    </>
  );
}
