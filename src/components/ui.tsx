import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUI } from "../state";
export const colors = {
  bg: "#101014",
  panel: "#1b1b22",
  raised: "#23232d",
  line: "#30303b",
  text: "#f4f2fa",
  muted: "#9694a6",
  purple: "#bca3ff",
  green: "#8cdbb5",
  amber: "#ebc184",
  red: "#f69ba7",
};
export function Icon({
  name,
  size = 21,
  color = colors.muted,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <Ionicons
      name={name as React.ComponentProps<typeof Ionicons>["name"]}
      size={size}
      color={color}
    />
  );
}
export function Copy({
  children,
  size = 14,
  color = colors.text,
  bold = false,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  bold?: boolean;
  style?: object;
}) {
  return (
    <Text
      style={[
        {
          color,
          fontSize: size,
          lineHeight: size * 1.5,
          fontWeight: bold ? "600" : "400",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Heading({
  children,
  size = 28,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <Text
      style={{
        color: colors.text,
        fontSize: size,
        fontWeight: "700",
        letterSpacing: -0.8,
        lineHeight: size * 1.3,
      }}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  icon,
  secondary = false,
  disabled = false,
  danger = false,
  small = false,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  secondary?: boolean;
  disabled?: boolean;
  danger?: boolean;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: danger
            ? "#42232c"
            : secondary
              ? colors.raised
              : colors.purple,
          paddingHorizontal: small ? 14 : 19,
          paddingVertical: small ? 10 : 14,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={small ? 17 : 19}
          color={danger ? colors.red : secondary ? colors.text : "#211735"}
        />
      )}
      <Copy
        size={small ? 12 : 14}
        color={danger ? colors.red : secondary ? colors.text : "#211735"}
        bold
      >
        {title}
      </Copy>
    </Pressable>
  );
}
export function FadeIn({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (active)
        Animated.timing(value, {
          toValue: 1,
          duration: reduced ? 0 : 450,
          delay: reduced ? 0 : delay,
          useNativeDriver: true,
        }).start();
    });
    return () => {
      active = false;
      value.stopAnimation();
    };
  }, [value, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Badge({ value }: { value: string }) {
  const color = ["ACCEPTED", "PAID", "COMPLETED", "READY", "PUBLIC"].includes(
    value,
  )
    ? colors.green
    : ["IN_PROGRESS", "SENT", "PARTIALLY_PAID"].includes(value)
      ? colors.purple
      : ["REJECTED", "CANCELLED", "OVERDUE"].includes(value)
        ? colors.red
        : colors.amber;
  return (
    <View
      style={{
        borderRadius: 6,
        paddingHorizontal: 9,
        paddingVertical: 4,
        backgroundColor: color + "16",
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      }}
    >
      <View
        style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }}
      />
      <Text
        style={{
          fontSize: 10,
          color,
          fontWeight: "600",
          textTransform: "capitalize",
        }}
      >
        {value.toLowerCase().replaceAll("_", " ")}
      </Text>
    </View>
  );
}
export function Avatar({
  name,
  size = 40,
  index = 0,
}: {
  name: string;
  size?: number;
  index?: number;
}) {
  const palette = [colors.purple, colors.green, colors.amber, "#90bdf4"];
  const color = palette[index % palette.length]!;
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color + "18",
        borderRadius: size * 0.29,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Copy color={color} size={size * 0.32} bold>
        {name
          .split(/\s+/)
          .slice(0, 2)
          .map((n) => n[0])
          .join("")
          .toUpperCase()}
      </Copy>
    </View>
  );
}
export function Search({
  value,
  onChangeText,
  placeholder = "Search anything…",
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.line,
        paddingHorizontal: 14,
        borderRadius: 12,
      }}
    >
      <Icon name="search-outline" size={18} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          minWidth: 80,
          height: 46,
          color: colors.text,
          fontSize: 13,
        }}
      />
      {value ? (
        <Pressable
          accessibilityLabel="Clear search"
          onPress={() => onChangeText("")}
        >
          <Icon name="close-circle" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}
export function Empty({
  title,
  subtitle,
  action,
  onPress,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 44, gap: 14 }}>
      <LinearGradient
        colors={["#373044", "#24212e"]}
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="sparkles-outline" color={colors.purple} size={28} />
      </LinearGradient>
      <Heading size={20}>{title}</Heading>
      <Copy color={colors.muted} style={{ textAlign: "center", maxWidth: 330 }}>
        {subtitle}
      </Copy>
      {action && onPress && (
        <Button title={action} onPress={onPress} icon="add" small />
      )}
    </Card>
  );
}
export function Sheet({
  visible,
  title,
  subtitle,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const locked = useUI((state) => state.locked);
  return (
    <Modal
      visible={visible && !locked}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable
          accessibilityLabel="Close dialog"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={[s.row, { padding: 24, paddingTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Heading size={23}>{title}</Heading>
              {subtitle && (
                <Copy color={colors.muted} size={12}>
                  {subtitle}
                </Copy>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={s.iconButton}
            >
              <Icon name="close" />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 24,
              paddingTop: 0,
              gap: 18,
              paddingBottom: 44,
            }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function Confirm({
  visible,
  title,
  message,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <Copy color={colors.muted}>{message}</Copy>
      <Button title="Confirm" onPress={onConfirm} />
      <Button title="Cancel" onPress={onClose} secondary />
    </Sheet>
  );
}
export function Skeleton() {
  const [opacity, setOpacity] = useState(0.5);
  useEffect(() => {
    const timer = setInterval(
      () => setOpacity((x) => (x === 0.5 ? 0.8 : 0.5)),
      800,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <View style={{ gap: 18, opacity }}>
      {[100, 150, 150].map((h, i) => (
        <View
          key={i}
          style={{
            height: h,
            backgroundColor: colors.raised,
            borderRadius: 18,
          }}
        />
      ))}
    </View>
  );
}
export const s = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    padding: 22,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  section: { gap: 18 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.raised,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 720,
    maxHeight: "92%",
    backgroundColor: colors.panel,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555360",
    alignSelf: "center",
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 14,
    minHeight: 48,
  },
  divider: { height: 1, backgroundColor: colors.line },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
