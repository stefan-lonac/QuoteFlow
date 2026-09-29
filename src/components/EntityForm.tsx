import React, { useState } from "react";
import { Image, Pressable, TextInput, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  definitions,
  fieldsFor,
  initialValues,
  label,
  sectionTitles,
  type EntityName,
  type Row,
} from "../domain/catalog";
import { formSchema, valuesToRow } from "../domain/validation";
import { useData, useRefresh, useStore } from "../data/context";
import { id, selectImage } from "../services/files";
import { useUI } from "../state";
import { Button, Copy, Sheet, colors, s } from "./ui";
export function EntityForm({
  entity,
  original,
  defaults,
  onClose,
}: {
  entity: EntityName;
  original?: Row;
  defaults?: Record<string, string>;
  onClose: () => void;
}) {
  const store = useStore();
  const { data } = useData();
  const refresh = useRefresh();
  const notify = useUI((x) => x.notify);
  const [failure, setFailure] = useState("");
  const profile = data?.profile[0];
  const inherited = Object.fromEntries(
    [
      "currency",
      "hourlyRate",
      "testingPercent",
      "managementPercent",
      "bufferPercent",
      "taxPercent",
    ]
      .filter((k) => profile?.[k] != null)
      .map((k) => [k, String(profile![k])]),
  );
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({
    resolver: zodResolver(formSchema(entity)),
    defaultValues: {
      ...initialValues(entity),
      ...inherited,
      ...defaults,
      ...(original
        ? Object.fromEntries(
            Object.entries(original).map(([k, v]) => [
              k,
              v == null ? "" : String(v),
            ]),
          )
        : {}),
    },
  });
  const submit = handleSubmit(async (values) => {
    try {
      setFailure("");
      const row = valuesToRow(entity, values, original?.id ?? id(), original);
      await store.transaction(async () => {
        await store.repository(entity).save(row);
        if (entity === "proposals" && !original)
          for (const [position, title] of sectionTitles.entries())
            await store.repository("proposalSections").save(
              valuesToRow(
                "proposalSections",
                {
                  proposalId: row.id,
                  title,
                  content:
                    title === "Terms"
                      ? String(profile?.paymentTerms || "")
                      : title === "About"
                        ? String(profile?.summary || "")
                        : "",
                  position: String(position),
                },
                id(),
              ),
            );
      });
      await refresh();
      notify(`${definitions[entity].singular} saved`);
      onClose();
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "Could not save. Please try again.",
      );
    }
  });
  return (
    <Sheet
      visible
      title={`${original ? "Edit" : "New"} ${definitions[entity].singular}`}
      subtitle="Saved privately on this device."
      onClose={onClose}
    >
      {fieldsFor(entity).map((f) => (
        <View key={f.key} style={{ gap: 8 }}>
          <Copy size={12} color={colors.muted} bold>
            {f.label}
            {f.required ? " *" : ""}
          </Copy>
          <Controller
            control={control}
            name={f.key}
            render={({ field: { value, onChange, onBlur } }) => {
              if (f.type === "select" || f.type === "relation") {
                const options =
                  f.options?.map((v) => ({
                    id: v,
                    title: v.toLowerCase().replaceAll("_", " "),
                  })) ??
                  data?.[f.entity!]?.map((r) => ({
                    id: r.id,
                    title: label(r),
                  })) ??
                  [];
                return (
                  <View style={s.chips}>
                    {!f.required && (
                      <Pressable
                        onPress={() => onChange("")}
                        style={[
                          s.input,
                          { backgroundColor: !value ? "#3b304f" : colors.bg },
                        ]}
                      >
                        <Copy size={12}>None</Copy>
                      </Pressable>
                    )}
                    {options.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => {
                          onChange(option.id);
                          if (
                            entity === "estimateItems" &&
                            f.entity === "services"
                          ) {
                            const service = data?.services.find(
                              (x) => x.id === option.id,
                            );
                            if (service) {
                              setValue(
                                "minHours",
                                String(service.defaultMinHours ?? 0),
                              );
                              setValue(
                                "maxHours",
                                String(service.defaultMaxHours ?? 8),
                              );
                              setValue(
                                "selectedHours",
                                String(service.defaultMinHours ?? 0),
                              );
                              if (service.hourlyRateOverride != null)
                                setValue(
                                  "hourlyRate",
                                  String(service.hourlyRateOverride),
                                );
                              if (
                                service.defaultPrice != null &&
                                !getValues("manualPrice")
                              )
                                setValue(
                                  "manualPrice",
                                  String(service.defaultPrice),
                                );
                            }
                          }
                          if (
                            entity === "estimateItems" &&
                            f.entity === "technologies"
                          ) {
                            const tech = data?.technologies.find(
                              (x) => x.id === option.id,
                            );
                            if (tech?.hourlyRateOverride != null)
                              setValue(
                                "hourlyRate",
                                String(tech.hourlyRateOverride),
                              );
                          }
                        }}
                        style={[
                          s.input,
                          {
                            padding: 10,
                            minHeight: 38,
                            borderColor:
                              value === option.id ? colors.purple : colors.line,
                            backgroundColor:
                              value === option.id ? "#30273f" : colors.bg,
                          },
                        ]}
                      >
                        <Copy
                          size={12}
                          color={
                            value === option.id ? colors.purple : colors.text
                          }
                        >
                          {option.title}
                        </Copy>
                      </Pressable>
                    ))}
                    {!options.length && (
                      <Copy color={colors.muted} size={12}>
                        Create a {f.entity} record first.
                      </Copy>
                    )}
                  </View>
                );
              }
              if (f.type === "image")
                return (
                  <View style={{ gap: 8 }}>
                    {value ? (
                      <Image
                        source={{ uri: value }}
                        style={{ height: 130, borderRadius: 12, width: "100%" }}
                        resizeMode="contain"
                      />
                    ) : null}
                    <Button
                      secondary
                      small
                      title="Choose image"
                      icon="image-outline"
                      onPress={async () => {
                        try {
                          const uri = await selectImage(store);
                          if (uri) onChange(uri);
                        } catch (e) {
                          setFailure(String(e));
                        }
                      }}
                    />
                    {value ? (
                      <Button
                        title="Remove image"
                        secondary
                        small
                        onPress={() => onChange("")}
                      />
                    ) : null}
                  </View>
                );
              return (
                <TextInput
                  accessibilityLabel={f.label}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={
                    f.type === "date"
                      ? "YYYY-MM-DD"
                      : f.type === "number"
                        ? "0"
                        : f.label
                  }
                  placeholderTextColor="#666473"
                  keyboardType={
                    f.type === "number"
                      ? "decimal-pad"
                      : f.key === "email"
                        ? "email-address"
                        : "default"
                  }
                  autoCapitalize={
                    f.key === "currency"
                      ? "characters"
                      : f.key === "email" || f.key === "website"
                        ? "none"
                        : "sentences"
                  }
                  multiline={f.type === "long"}
                  style={[
                    s.input,
                    f.type === "long" && {
                      minHeight: 110,
                      textAlignVertical: "top",
                    },
                    !!errors[f.key] && { borderColor: colors.red },
                  ]}
                />
              );
            }}
          />
          {errors[f.key] && (
            <Copy color={colors.red} size={12}>
              {errors[f.key]?.message}
            </Copy>
          )}
        </View>
      ))}
      {failure ? <Copy color={colors.red}>{failure}</Copy> : null}
      <Button
        title={isSubmitting ? "Saving…" : "Save changes"}
        disabled={isSubmitting}
        onPress={submit}
        icon="checkmark"
      />
      <Copy size={11} color={colors.muted} style={{ textAlign: "center" }}>
        Your data stays yours. No account. No cloud required.
      </Copy>
    </Sheet>
  );
}
