import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { Link, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar, Copy, Icon, colors, s } from "./ui";
import { useData } from "../data/context";
import { useUI } from "../state";
const primary = [
  { title: "Overview", path: "/", icon: "grid-outline" },
  { title: "Clients", path: "/clients", icon: "people-outline" },
  { title: "Estimates", path: "/estimates", icon: "calculator-outline" },
  { title: "Projects", path: "/projects", icon: "layers-outline" },
];
const secondary = [
  { title: "Proposals", path: "/proposals", icon: "document-text-outline" },
  { title: "Portfolio", path: "/portfolio", icon: "briefcase-outline" },
  { title: "Revenue", path: "/revenue", icon: "bar-chart-outline" },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useData();
  const profile = data?.profile[0];
  const toast = useUI((x) => x.toast);
  const nav = (
    item: { title: string; path: string; icon: string },
    mobile = false,
  ) => {
    const active =
      pathname === item.path ||
      (item.path === "/more" &&
        !(mobile ? primary : [...primary, ...secondary]).some(
          (n) => n.path === pathname,
        ));
    return (
      <Link key={item.path} href={item.path as "/"} asChild>
        <Pressable
          style={{
            flexDirection: mobile ? "column" : "row",
            alignItems: "center",
            gap: mobile ? 4 : 13,
            paddingVertical: mobile ? 10 : 13,
            paddingHorizontal: mobile ? 8 : 16,
            borderRadius: 10,
            backgroundColor: active && !mobile ? "#bca3ff18" : "transparent",
            flex: mobile ? 1 : undefined,
          }}
        >
          <Icon
            name={item.icon}
            size={mobile ? 22 : 19}
            color={active ? colors.purple : colors.muted}
          />
          <Copy
            size={mobile ? 10 : 13}
            color={active ? colors.purple : colors.muted}
            bold={active}
          >
            {mobile && item.path === "/" ? "Home" : item.title}
          </Copy>
          {!mobile && active && (
            <View
              style={{
                marginLeft: "auto",
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: colors.purple,
              }}
            />
          )}
        </Pressable>
      </Link>
    );
  };
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        flexDirection: "row",
        paddingTop: insets.top,
      }}
    >
      {wide && (
        <View
          style={{
            width: 240,
            borderRightWidth: 1,
            borderRightColor: colors.line,
            padding: 22,
            gap: 28,
          }}
        >
          <Link href="/" asChild>
            <Pressable style={{ ...s.row, paddingVertical: 12 }}>
              <LinearGradient
                colors={["#d7c4ff", "#9475d9"]}
                style={{
                  width: 34,
                  height: 38,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ rotate: "-7deg" }],
                }}
              >
                <Icon name="flash" color="#322044" size={23} />
              </LinearGradient>
              <Copy size={22} bold>
                QuoteFlow<Copy color={colors.purple}>.</Copy>
              </Copy>
            </Pressable>
          </Link>
          <View style={{ gap: 5 }}>
            <Copy
              size={10}
              color="#686574"
              bold
              style={{ letterSpacing: 2, marginBottom: 12, marginLeft: 16 }}
            >
              WORKSPACE
            </Copy>
            {primary.map((i) => nav(i))}
          </View>
          <View style={{ gap: 5 }}>
            <Copy
              size={10}
              color="#686574"
              bold
              style={{ letterSpacing: 2, marginBottom: 12, marginLeft: 16 }}
            >
              BUSINESS
            </Copy>
            {secondary.map((i) => nav(i))}
            {nav({ title: "More tools", path: "/more", icon: "apps-outline" })}
          </View>
          <View style={{ flex: 1 }} />
          <LinearGradient
            colors={["#282133", "#1c1a24"]}
            style={{
              borderRadius: 14,
              padding: 16,
              gap: 8,
              borderWidth: 1,
              borderColor: "#393042",
            }}
          >
            <Icon
              name="shield-checkmark-outline"
              color={colors.purple}
              size={22}
            />
            <Copy size={12} bold>
              Your work. Your data.
            </Copy>
            <Copy size={11} color={colors.muted}>
              Private by design. Everything you need, right here.
            </Copy>
            <View style={[s.row, { gap: 6, marginTop: 6 }]}>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 4,
                  backgroundColor: colors.green,
                }}
              />
              <Copy size={10} color={colors.green}>
                LOCAL WORKSPACE
              </Copy>
            </View>
          </LinearGradient>
          {nav({
            title: "Settings",
            path: "/settings",
            icon: "settings-outline",
          })}
          <Pressable
            onPress={() => router.push("/profile")}
            style={[
              s.row,
              {
                borderTopWidth: 1,
                borderTopColor: colors.line,
                paddingTop: 20,
              },
            ]}
          >
            <Avatar
              name={String(profile?.firstName || "Your workspace")}
              size={35}
            />
            <View style={{ flex: 1 }}>
              <Copy size={12} bold>
                {profile
                  ? String(profile.firstName) + " " + (profile.lastName || "")
                  : "Your workspace"}
              </Copy>
              <Copy size={10} color={colors.muted}>
                Independent & in control
              </Copy>
            </View>
            <Icon name="chevron-forward" size={14} />
          </Pressable>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={[
            s.between,
            {
              paddingHorizontal: wide ? 36 : 22,
              height: wide ? 76 : 65,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
            },
          ]}
        >
          <View style={s.row}>
            {!wide && <Icon name="flash" color={colors.purple} size={23} />}
            <Copy
              size={wide ? 12 : 19}
              bold={!wide}
              color={wide ? colors.muted : colors.text}
            >
              {wide
                ? "Workspace  /  " +
                  (pathname === "/"
                    ? "Overview"
                    : pathname.slice(1).replaceAll("-", " "))
                : "QuoteFlow."}
            </Copy>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
            <View
              style={{ flexDirection: "row", gap: 6, alignItems: "center" }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 4,
                  backgroundColor: colors.green,
                }}
              />
              <Copy color={colors.muted} size={11}>
                {Platform.OS === "web" ? "Browser preview" : "Saved on device"}
              </Copy>
            </View>
            <Pressable
              accessibilityLabel="Open profile"
              onPress={() => router.push("/profile")}
            >
              <Avatar name={String(profile?.firstName || "Q F")} size={32} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: wide ? 36 : 22,
            paddingBottom: 42,
            width: "100%",
            maxWidth: 1480,
            alignSelf: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {!wide && (
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#18181f",
              borderTopWidth: 1,
              borderTopColor: colors.line,
              paddingBottom: Math.max(insets.bottom, 6),
            }}
          >
            {[
              ...primary,
              { title: "More", path: "/more", icon: "apps-outline" },
            ].map((i) => nav(i, true))}
          </View>
        )}
      </View>
      {toast ? (
        <View
          accessibilityRole="alert"
          style={{
            position: "absolute",
            bottom: wide ? 24 : 90 + insets.bottom,
            left: wide ? 270 : 20,
            right: 20,
            alignItems: "center",
          }}
        >
          <View
            style={[
              s.row,
              {
                padding: 16,
                borderRadius: 14,
                backgroundColor: "#343044",
                borderWidth: 1,
                borderColor: "#655582",
                maxWidth: 620,
              },
            ]}
          >
            <Icon name="checkmark-circle-outline" color={colors.purple} />
            <Copy size={13}>{toast}</Copy>
          </View>
        </View>
      ) : null}
    </View>
  );
}
