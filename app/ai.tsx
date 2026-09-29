import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { z } from "zod";
import { useData, useRefresh, useStore } from "../src/data/context";
import { initialValues } from "../src/domain/catalog";
import { formSchema, valuesToRow } from "../src/domain/validation";
import { id } from "../src/services/files";
import {
  getSecret,
  nativeSecurity,
  removeSecret,
  setSecret,
} from "../src/services/security";
import { provider } from "../src/services/ai";
import { useUI } from "../src/state";
import {
  Button,
  Card,
  Confirm,
  Copy,
  Heading,
  colors,
  s,
} from "../src/components/ui";
const cvKeys = [
  "firstName",
  "lastName",
  "professionalTitle",
  "summary",
  "email",
  "phone",
  "company",
  "website",
  "experience",
  "companies",
  "projects",
  "technologies",
  "skills",
  "education",
  "languages",
  "certifications",
] as const;
const cvSchema = z
  .object(
    Object.fromEntries(
      cvKeys.map((k) => [k, z.string().max(12000).optional()]),
    ),
  )
  .strict();
export default function AI() {
  const { data } = useData();
  const store = useStore();
  const refresh = useRefresh();
  const notify = useUI((x) => x.notify);
  const [key, setKey] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [configured, setConfigured] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [task, setTask] = useState("Generate scope of work");
  const [suggestion, setSuggestion] = useState("");
  const [section, setSection] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<"text" | "cv" | null>(null);
  const [cv, setCV] = useState<Record<string, string>>();
  const [selected, setSelected] = useState<string[]>([]);
  const [pdf, setPDF] = useState<{ name: string; base64: string }>();
  const [apply, setApply] = useState<"text" | "cv" | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    void getSecret("qf-ai-openai").then((k) => setConfigured(!!k));
    void getSecret("qf-ai-model").then((m) => {
      if (m) setModel(m);
    });
    return () => controller.current?.abort();
  }, []);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const request = async (kind: "text" | "cv") => {
    setPending(null);
    await run(async () => {
      controller.current = new AbortController();
      const timer = setTimeout(() => controller.current?.abort(), 90000);
      try {
        const result = await provider("openai").suggest({
          signal: controller.current.signal,
          prompt:
            kind === "text"
              ? task + ". Requirements / text:\n" + prompt
              : "Extract this CV as a JSON object only. Allowed keys: " +
                cvKeys.join(", ") +
                ". All values must be strings. For lists, use newline-separated strings. Omit missing facts. Do not include markdown.",
          pdf: kind === "cv" ? pdf : undefined,
        });
        if (kind === "text") setSuggestion(result);
        else {
          const start = result.indexOf("{");
          const end = result.lastIndexOf("}");
          const parsed = cvSchema.parse(
            JSON.parse(result.slice(start, end + 1)),
          );
          setCV(
            Object.fromEntries(
              Object.entries(parsed).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === "string",
              ),
            ),
          );
          setSelected([]);
          setPDF(undefined);
        }
      } finally {
        clearTimeout(timer);
      }
    });
  };
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Copy color={colors.purple} size={10} bold style={{ letterSpacing: 2 }}>
          A LITTLE HELP, ON YOUR TERMS
        </Copy>
        <Heading>Your writing companion.</Heading>
        <Copy color={colors.muted}>
          Suggestions, never decisions. Nothing changes until you review and
          apply it.
        </Copy>
      </View>
      <Card style={{ gap: 16 }}>
        <Heading size={20}>Provider connection</Heading>
        <Copy color={colors.muted}>
          OpenAI · {configured ? "Key saved in SecureStore" : "Not connected"}.
          Internet and a funded provider account are needed only for AI
          requests.
        </Copy>
        {nativeSecurity ? (
          <>
            <TextInput
              accessibilityLabel="OpenAI API key"
              secureTextEntry
              value={key}
              onChangeText={setKey}
              autoCapitalize="none"
              placeholder="OpenAI API key"
              placeholderTextColor={colors.muted}
              style={s.input}
            />
            <TextInput
              accessibilityLabel="AI model"
              value={model}
              onChangeText={setModel}
              autoCapitalize="none"
              placeholder="Model supporting text and PDF input"
              placeholderTextColor={colors.muted}
              style={s.input}
            />
            <Button
              title="Save connection"
              disabled={busy || (!key && !configured) || !model.trim()}
              onPress={() =>
                run(async () => {
                  if (key.trim()) {
                    await setSecret("qf-ai-openai", key.trim());
                    setKey("");
                    setConfigured(true);
                  }
                  await setSecret("qf-ai-model", model.trim());
                  notify("Connection saved securely.");
                })
              }
            />
            <Button
              title="Remove API key"
              secondary
              disabled={busy || !configured}
              onPress={() =>
                run(async () => {
                  await removeSecret("qf-ai-openai");
                  setConfigured(false);
                  notify("API key removed.");
                })
              }
            />
          </>
        ) : (
          <Copy color={colors.amber}>
            Configure AI on Android. Browser preview does not store provider
            secrets.
          </Copy>
        )}
        <Copy color={colors.muted} size={11}>
          Direct keys are for private use only. Public distribution requires a
          server-side AI gateway. Anthropic and Gemini can be added through the
          AIProvider interface.
        </Copy>
      </Card>
      <Card style={{ gap: 16 }}>
        <Heading size={20}>Find the right words</Heading>
        <View style={s.chips}>
          {[
            "Analyze requirements",
            "Suggest technologies",
            "Suggest services",
            "Generate scope of work",
            "Generate proposal description",
            "Generate deliverables",
            "Generate maintenance description",
            "Improve proposal text",
          ].map((t) => (
            <Pressable
              key={t}
              onPress={() => setTask(t)}
              style={{
                padding: 10,
                borderRadius: 9,
                backgroundColor: task === t ? "#3a2c4b" : colors.bg,
              }}
            >
              <Copy size={11} color={task === t ? colors.purple : colors.muted}>
                {t}
              </Copy>
            </Pressable>
          ))}
        </View>
        <TextInput
          accessibilityLabel="Requirements or draft text"
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe the project, or paste the text you would like to improve…"
          placeholderTextColor={colors.muted}
          multiline
          style={[s.input, { minHeight: 150, textAlignVertical: "top" }]}
        />
        <Button
          title={busy ? "Working…" : "Review & send request"}
          icon="sparkles-outline"
          disabled={busy || !configured || !prompt.trim()}
          onPress={() => setPending("text")}
        />
        {busy && (
          <Button
            title="Cancel request"
            secondary
            onPress={() => controller.current?.abort()}
          />
        )}
        {suggestion ? (
          <>
            <Copy color={colors.purple} bold>
              Review suggestion
            </Copy>
            <TextInput
              accessibilityLabel="Editable AI suggestion"
              value={suggestion}
              onChangeText={setSuggestion}
              multiline
              style={[s.input, { minHeight: 200, textAlignVertical: "top" }]}
            />
            <Copy color={colors.muted} size={12}>
              Choose a proposal section to replace with your reviewed text:
            </Copy>
            <View style={s.chips}>
              {data?.proposalSections.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSection(item.id)}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor:
                      section === item.id ? "#3a2c4b" : colors.bg,
                  }}
                >
                  <Copy size={11}>
                    {
                      data.proposals.find((p) => p.id === item.proposalId)
                        ?.title
                    }{" "}
                    · {item.title}
                  </Copy>
                </Pressable>
              ))}
            </View>
            <Button
              title="Apply reviewed text"
              disabled={busy || !section}
              onPress={() => setApply("text")}
            />
          </>
        ) : null}
      </Card>
      <Card style={{ gap: 16 }}>
        <Heading size={20}>Your CV, a head start.</Heading>
        <Copy color={colors.muted}>
          Choose a PDF (up to 10 MB). Review the extracted information and
          select each field you want to import.
        </Copy>
        <Button
          title="Choose CV PDF"
          secondary
          icon="document-attach-outline"
          disabled={busy || !configured}
          onPress={() =>
            run(async () => {
              const result = await DocumentPicker.getDocumentAsync({
                type: "application/pdf",
                copyToCacheDirectory: true,
              });
              if (result.canceled) return;
              const asset = result.assets[0]!;
              if ((asset.size || 0) > 10 * 1024 * 1024)
                throw new Error("Choose a PDF smaller than 10 MB.");
              if (Platform.OS === "web")
                throw new Error("CV import requires the Android app.");
              const base64 = await FileSystem.readAsStringAsync(asset.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              setPDF({ name: asset.name, base64 });
              setPending("cv");
            })
          }
        />
        {cv && (
          <>
            <Heading size={18}>Review Imported Information</Heading>
            {Object.entries(cv).map(([k, v]) => (
              <Pressable
                key={k}
                onPress={() =>
                  setSelected((prev) =>
                    prev.includes(k)
                      ? prev.filter((f) => f !== k)
                      : [...prev, k],
                  )
                }
              >
                <Card
                  style={{
                    padding: 14,
                    backgroundColor: selected.includes(k)
                      ? "#30273f"
                      : colors.bg,
                    gap: 5,
                  }}
                >
                  <Copy bold color={colors.purple}>
                    {selected.includes(k) ? "☑" : "☐"} {k}
                  </Copy>
                  <Copy size={12}>{v}</Copy>
                </Card>
              </Pressable>
            ))}
            <Copy size={11} color={colors.muted}>
              Additional experience, education and skills are saved as reviewed
              CV notes. Technologies become individual catalog entries. Profile
              fields are replaced only when selected.
            </Copy>
            <Button
              title={"Import " + selected.length + " selected fields"}
              disabled={!selected.length || busy}
              onPress={() => setApply("cv")}
            />
          </>
        )}
      </Card>
      <Confirm
        visible={!!pending}
        title="Send this content to OpenAI?"
        message={
          pending === "cv"
            ? "Your selected CV PDF (" +
              (pdf?.name || "") +
              ") will be sent to OpenAI for extraction. Provider usage charges may apply. No profile data will change automatically."
            : "Only the requirements or text you entered and the selected writing task will be sent to OpenAI. Provider usage charges may apply."
        }
        onClose={() => {
          setPending(null);
          setPDF(undefined);
        }}
        onConfirm={() => {
          if (pending) void request(pending);
        }}
      />
      <Confirm
        visible={!!apply}
        title="Apply reviewed information?"
        message={
          apply === "cv"
            ? "Only the individually selected fields will be imported. Selected profile fields replace existing values."
            : "This replaces the selected proposal section with the text you reviewed. Prices and estimates are unchanged."
        }
        onClose={() => setApply(null)}
        onConfirm={() => {
          const action = apply;
          setApply(null);
          void run(async () => {
            if (action === "text") {
              const row = data?.proposalSections.find((s) => s.id === section);
              if (!row) throw new Error("Select an existing proposal section.");
              await store.repository("proposalSections").save({
                ...row,
                content: suggestion,
                updatedAt: new Date().toISOString(),
              });
            } else if (cv && data) {
              await store.transaction(async () => {
                const previous = data.profile[0];
                const profileFields = Object.keys(initialValues("profile"));
                const values = {
                  ...initialValues("profile"),
                  ...(previous
                    ? Object.fromEntries(
                        Object.entries(previous).map(([k, v]) => [
                          k,
                          String(v ?? ""),
                        ]),
                      )
                    : {}),
                };
                for (const field of selected)
                  if (profileFields.includes(field)) values[field] = cv[field]!;
                if (selected.some((field) => profileFields.includes(field))) {
                  const validated = formSchema("profile").safeParse(values);
                  if (!validated.success)
                    throw new Error(
                      "Review selected profile fields: " +
                        validated.error.issues[0]?.message,
                    );
                  await store
                    .repository("profile")
                    .save(
                      valuesToRow(
                        "profile",
                        values,
                        previous?.id || id(),
                        previous,
                      ),
                    );
                }
                if (selected.includes("technologies"))
                  for (const name of cv
                    .technologies!.split(/[\n,;]+/)
                    .map((n) => n.trim())
                    .filter(Boolean)) {
                    if (
                      !data.technologies.some(
                        (t) =>
                          String(t.name).toLowerCase() === name.toLowerCase(),
                      )
                    )
                      await store
                        .repository("technologies")
                        .save(
                          valuesToRow(
                            "technologies",
                            { ...initialValues("technologies"), name },
                            id(),
                          ),
                        );
                  }
                const extra = Object.fromEntries(
                  selected
                    .filter(
                      (k) => !profileFields.includes(k) && k !== "technologies",
                    )
                    .map((k) => [k, cv[k]]),
                );
                if (Object.keys(extra).length) {
                  const now = new Date().toISOString();
                  const old = data.settings.find((s) => s.name === "cvNotes");
                  await store.repository("settings").save({
                    id: "cv-notes",
                    name: "cvNotes",
                    value: JSON.stringify({
                      ...(old ? JSON.parse(String(old.value)) : {}),
                      ...extra,
                    }),
                    createdAt: old?.createdAt || now,
                    updatedAt: now,
                  });
                }
              });
              setCV(undefined);
              setSelected([]);
            }
            await refresh();
            notify("Reviewed information saved.");
          });
        }}
      />
      {data?.settings.find((s) => s.name === "cvNotes") && (
        <Card style={{ gap: 12 }}>
          <Heading size={18}>Imported CV notes</Heading>
          {Object.entries(
            JSON.parse(
              String(data.settings.find((s) => s.name === "cvNotes")!.value),
            ) as Record<string, string>,
          ).map(([k, v]) => (
            <View key={k}>
              <Copy color={colors.purple}>{k}</Copy>
              <Copy color={colors.muted} size={12}>
                {v}
              </Copy>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}
