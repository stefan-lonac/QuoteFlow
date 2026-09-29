import React, { useState } from "react";
import { Image, View } from "react-native";
import { useRouter } from "expo-router";
import { useData } from "../src/data/context";
import { EntityForm } from "../src/components/EntityForm";
import {
  Avatar,
  Button,
  Card,
  Copy,
  Heading,
  Skeleton,
  colors,
  s,
} from "../src/components/ui";
import { money } from "../src/domain/calculations";
export default function Profile() {
  const { data } = useData();
  const [edit, setEdit] = useState(false);
  const router = useRouter();
  if (!data) return <Skeleton />;
  const p = data.profile[0];
  return (
    <View style={{ gap: 24 }}>
      <Heading>Your professional profile.</Heading>
      <Copy color={colors.muted}>
        The person behind the great work. Used in your proposals and default
        estimates.
      </Copy>
      <Card style={{ gap: 20 }}>
        {p?.profileImage ? (
          <Image
            source={{ uri: String(p.profileImage) }}
            style={{ width: 88, height: 88, borderRadius: 26 }}
          />
        ) : (
          <Avatar size={88} name={String(p?.firstName || "Your name")} />
        )}
        <View>
          <Heading>
            {p ? p.firstName + " " + (p.lastName || "") : "Make it yours"}
          </Heading>
          <Copy color={colors.purple}>
            {p?.professionalTitle ||
              "Independent developer & creative problem solver"}
          </Copy>
        </View>
        <Copy color={colors.muted}>
          {p?.summary ||
            "Add a little about yourself. Your expertise deserves a good introduction."}
        </Copy>
        {p && (
          <View style={s.chips}>
            <Copy color={colors.muted}>{p.email}</Copy>
            <Copy color={colors.muted}>{p.website}</Copy>
          </View>
        )}
        <Button
          title={p ? "Edit profile" : "Set up your profile"}
          icon="create-outline"
          onPress={() => setEdit(true)}
        />
      </Card>
      {p && (
        <Card style={{ gap: 15 }}>
          <Heading size={18}>Your defaults</Heading>
          <Copy>
            Hourly rate · {money(Number(p.hourlyRate), String(p.currency))}
          </Copy>
          <Copy color={colors.muted}>
            Testing {p.testingPercent}% · Management {p.managementPercent}% ·
            Buffer {p.bufferPercent}% · Tax {p.taxPercent}%
          </Copy>
          <Copy color={colors.muted}>{p.paymentTerms}</Copy>
        </Card>
      )}
      <Button
        title="Import from your CV"
        icon="document-attach-outline"
        secondary
        onPress={() => router.push("/ai")}
      />
      {edit && (
        <EntityForm
          entity="profile"
          original={p}
          onClose={() => setEdit(false)}
        />
      )}
    </View>
  );
}
