import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { definitions } from "../src/domain/catalog";
import {
  Card,
  Copy,
  FadeIn,
  Heading,
  Icon,
  colors,
  s,
} from "../src/components/ui";
export default function More() {
  const router = useRouter();
  const entries = [
    "proposals",
    "portfolio",
    "revenue",
    "maintenanceContracts",
    "maintenance",
    "technologies",
    "services",
    "profile",
    "ai",
    "settings",
  ] as const;
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 7 }}>
        <Copy color={colors.purple} size={10} bold style={{ letterSpacing: 2 }}>
          THE REST OF YOUR TOOLKIT
        </Copy>
        <Heading>Make space for great work.</Heading>
        <Copy color={colors.muted}>
          Everything that keeps your business in flow.
        </Copy>
      </View>
      {entries.map((entity, i) => {
        const def =
          entity === "revenue"
            ? {
                title: "Revenue & expenses",
                description: "A clear view of your financial health.",
                icon: "bar-chart-outline",
              }
            : entity === "ai"
              ? {
                  title: "Writing assistant & CV import",
                  description: "Optional help. Always your decision.",
                  icon: "sparkles-outline",
                }
              : definitions[entity];
        return (
          <FadeIn key={entity} delay={i * 35}>
            <Pressable onPress={() => router.push(("/" + entity) as "/")}>
              <Card style={s.row}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: "#bca3ff12",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={def.icon} color={colors.purple} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Copy bold>{def.title}</Copy>
                  <Copy color={colors.muted} size={12}>
                    {def.description ||
                      "Backup, security and workspace preferences."}
                  </Copy>
                </View>
                <Icon name="chevron-forward" size={17} />
              </Card>
            </Pressable>
          </FadeIn>
        );
      })}
    </View>
  );
}
