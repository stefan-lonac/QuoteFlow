import React, { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useData, useRefresh, useStore } from "../data/context";
import {
  definitions,
  fieldsFor,
  initialValues,
  label,
  sectionTitles,
  type EntityName,
  type Row,
} from "../domain/catalog";
import { calculateEstimate, money, revenue } from "../domain/calculations";
import { valuesToRow } from "../domain/validation";
import { id } from "../services/files";
import { exportPDF, multipliersFrom } from "../services/pdf";
import { useUI } from "../state";
import {
  Badge,
  Button,
  Card,
  Confirm,
  Copy,
  Heading,
  Sheet,
  colors,
  s,
} from "./ui";
import { EntityForm } from "./EntityForm";
export function EntityDetail({
  entity,
  rowId,
  onClose,
}: {
  entity: EntityName;
  rowId: string;
  onClose: () => void;
}) {
  const { data } = useData();
  const store = useStore();
  const refresh = useRefresh();
  const router = useRouter();
  const notify = useUI((x) => x.notify);
  const [form, setForm] = useState<{
    entity: EntityName;
    row?: Row;
    defaults?: Record<string, string>;
  }>();
  const [deleting, setDeleting] = useState(false);
  const [relatedDelete, setRelatedDelete] = useState<{
    entity: EntityName;
    id: string;
  }>();
  const [busy, setBusy] = useState(false);
  const [includeInternal, setIncludeInternal] = useState(false);
  const row = data?.[entity].find((r) => r.id === rowId);
  if (!row || !data) return null;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      await refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const linked = (name: EntityName, key: string) =>
    data[name].filter((r) => r[key] === row.id);
  const items =
    entity === "estimates" ? linked("estimateItems", "estimateId") : [];
  const totals =
    entity === "estimates"
      ? calculateEstimate(row, items, multipliersFrom(data))
      : null;
  const related = (
    title: string,
    name: EntityName,
    records: Row[],
    defaults: Record<string, string>,
  ) => (
    <View style={{ gap: 12 }}>
      <View style={s.between}>
        <Heading size={17}>{title}</Heading>
        <Button
          small
          secondary
          title="Add"
          icon="add"
          onPress={() => setForm({ entity: name, defaults })}
        />
      </View>
      {records.length ? (
        records.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setForm({ entity: name, row: r })}
          >
            <Card style={{ padding: 14, gap: 5 }}>
              <Copy bold size={13}>
                {name === "projectTechnologies"
                  ? label(
                      data.technologies.find((t) => t.id === r.technologyId)!,
                    )
                  : name === "projectServices"
                    ? label(data.services.find((t) => t.id === r.serviceId)!)
                    : label(r)}
              </Copy>
              <Copy color={colors.muted} size={12}>
                {r.content ||
                  r.notes ||
                  (name === "estimateItems"
                    ? String(r.selectedHours) +
                      " base hours · " +
                      money(Number(r.hourlyRate), String(row.currency)) +
                      "/h"
                    : "Tap to edit")}
              </Copy>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  setRelatedDelete({ entity: name, id: r.id });
                }}
              >
                <Copy size={10} color={colors.red}>
                  Remove {definitions[name].singular}
                </Copy>
              </Pressable>
            </Card>
          </Pressable>
        ))
      ) : (
        <Copy size={12} color={colors.muted}>
          Nothing added yet.
        </Copy>
      )}
    </View>
  );
  const convert = () =>
    run(async () => {
      const existing = await store.repository("proposals").get(row.id);
      if (existing?.projectId) {
        notify("This proposal already has a project.");
        return;
      }
      const projectId = id();
      await store.transaction(async () => {
        await store.repository("projects").save(
          valuesToRow(
            "projects",
            {
              ...initialValues("projects"),
              title: String(row.title),
              clientId: String(row.clientId),
              status: "ACCEPTED",
              finalPrice: String(row.price),
              estimatedPrice: String(row.price),
              currency: String(row.currency),
              description:
                (linked("proposalSections", "proposalId").find(
                  (s) => s.title === "Scope",
                )?.content as string) || "",
            },
            projectId,
          ),
        );
        await store
          .repository("proposals")
          .save({ ...row, projectId, updatedAt: new Date().toISOString() });
      });
      notify("Accepted proposal converted into a project.");
      onClose();
      router.push(("/projects?detail=" + projectId) as "/");
    });
  return (
    <>
      <Confirm
        visible={!!relatedDelete}
        title="Remove linked record?"
        message="This removes the selected record permanently. Export a backup first if you may need it later."
        onClose={() => setRelatedDelete(undefined)}
        onConfirm={() => {
          const target = relatedDelete;
          setRelatedDelete(undefined);
          if (target)
            void run(() => store.repository(target.entity).remove(target.id));
        }}
      />
      <Sheet
        visible
        title={label(row)}
        subtitle={definitions[entity].title}
        onClose={onClose}
      >
        {row.status && <Badge value={String(row.status)} />}
        <View style={[s.row, { flexWrap: "wrap" }]}>
          <Button
            title="Edit details"
            icon="create-outline"
            secondary
            small
            onPress={() => setForm({ entity, row })}
          />
          <Button
            title="Delete"
            icon="trash-outline"
            danger
            small
            onPress={() => setDeleting(true)}
          />
        </View>
        {entity === "clients" &&
          related(
            "Maintenance agreements",
            "maintenanceContracts",
            linked("maintenanceContracts", "clientId"),
            { clientId: row.id },
          )}
        {entity === "maintenanceContracts" &&
          related(
            "Received payments",
            "maintenanceReceipts",
            linked("maintenanceReceipts", "contractId"),
            {
              contractId: row.id,
              currency: String(row.currency),
              title: String(row.title),
              paidAmount: String(row.monthlyPrice || 0),
            },
          )}
        {fieldsFor(entity)
          .filter(
            (f) =>
              row[f.key] != null &&
              row[f.key] !== "" &&
              f.key !== "status" &&
              f.key !== "title" &&
              f.key !== "name",
          )
          .map((f) => (
            <View key={f.key} style={{ gap: 4 }}>
              <Copy size={10} color={colors.muted}>
                {f.label.toUpperCase()}
              </Copy>
              {f.type === "image" ? (
                <Image
                  source={{ uri: String(row[f.key]) }}
                  style={{ width: "100%", height: 180, borderRadius: 12 }}
                  resizeMode="cover"
                />
              ) : (
                <Copy size={13}>
                  {f.entity
                    ? label(
                        data[f.entity].find((r) => r.id === row[f.key]) || {
                          id: "Unknown",
                          createdAt: "",
                          updatedAt: "",
                        },
                      )
                    : String(row[f.key])}
                </Copy>
              )}
            </View>
          ))}
        {totals && (
          <>
            <View style={s.divider} />
            {related("Scope & deliverables", "estimateItems", items, {
              estimateId: row.id,
              hourlyRate: String(row.hourlyRate),
            })}
            <Card style={{ backgroundColor: "#282133", gap: 10 }}>
              <Heading size={18}>The estimate, explained</Heading>
              {[
                ["Development", totals.developmentHours],
                ["Testing", totals.testingHours],
                ["Project management", totals.managementHours],
                ["Deployment", totals.deploymentHours],
                ["Buffer", totals.bufferHours],
                ["Total hours", totals.totalHours],
              ].map(([title, amount]) => (
                <View key={title} style={s.between}>
                  <Copy color={colors.muted} size={12}>
                    {title}
                  </Copy>
                  <Copy size={12}>{amount} h</Copy>
                </View>
              ))}
              <View style={s.divider} />
              <View style={s.between}>
                <Copy color={colors.muted}>Internal price</Copy>
                <Copy>{money(totals.internalPrice, String(row.currency))}</Copy>
              </View>
              <View style={s.between}>
                <Copy color={colors.muted}>Tax</Copy>
                <Copy>{money(totals.tax, String(row.currency))}</Copy>
              </View>
              <View style={s.between}>
                <Copy bold>Final client price</Copy>
                <Heading size={24}>
                  {money(totals.finalPrice, String(row.currency))}
                </Heading>
              </View>
              {row.manualPrice != null && (
                <Copy color={colors.amber} size={11}>
                  Your manual price is preserved. Tax is added to the override.
                </Copy>
              )}
            </Card>
            <Button
              title="Export internal PDF"
              secondary
              icon="download-outline"
              disabled={busy}
              onPress={() => run(() => exportPDF("internal", row, data))}
            />
            <Button
              title="Create proposal from estimate"
              disabled={busy || !row.clientId}
              icon="document-text-outline"
              onPress={() =>
                run(async () => {
                  const proposalId = id();
                  await store.transaction(async () => {
                    await store.repository("proposals").save(
                      valuesToRow(
                        "proposals",
                        {
                          ...initialValues("proposals"),
                          title: String(row.title),
                          number:
                            "QF-" +
                            new Date().getFullYear() +
                            "-" +
                            proposalId.slice(0, 6).toUpperCase(),
                          clientId: String(row.clientId),
                          estimateId: row.id,
                          price: String(totals.finalPrice),
                          currency: String(row.currency),
                        },
                        proposalId,
                      ),
                    );
                    for (const [position, title] of sectionTitles.entries())
                      await store.repository("proposalSections").save(
                        valuesToRow(
                          "proposalSections",
                          {
                            proposalId,
                            title,
                            position: String(position),
                            content:
                              title === "Deliverables" || title === "Scope"
                                ? items.map((i) => String(i.title)).join("\n")
                                : title === "Technology Stack"
                                  ? [
                                      ...new Set(
                                        items
                                          .map(
                                            (i) =>
                                              data.technologies.find(
                                                (t) => t.id === i.technologyId,
                                              )?.name,
                                          )
                                          .filter(Boolean),
                                      ),
                                    ].join(", ")
                                  : title === "About"
                                    ? String(data.profile[0]?.summary || "")
                                    : title === "Terms"
                                      ? String(
                                          data.profile[0]?.paymentTerms || "",
                                        )
                                      : "",
                          },
                          id(),
                        ),
                      );
                  });
                  onClose();
                  router.push(("/proposals?detail=" + proposalId) as "/");
                })
              }
            />
            {!row.clientId && (
              <Copy color={colors.amber} size={12}>
                Choose a client before creating a proposal.
              </Copy>
            )}
          </>
        )}
        {entity === "proposals" && (
          <>
            <View style={s.divider} />
            {related(
              "Your proposal",
              "proposalSections",
              linked("proposalSections", "proposalId").sort(
                (a, b) => Number(a.position) - Number(b.position),
              ),
              {
                proposalId: row.id,
                position: String(
                  linked("proposalSections", "proposalId").length,
                ),
              },
            )}
            <Pressable
              onPress={() => setIncludeInternal((v) => !v)}
              style={s.row}
            >
              <Copy
                color={includeInternal ? colors.amber : colors.muted}
                size={12}
              >
                {includeInternal ? "☑" : "☐"} Explicitly include internal hourly
                calculations in client PDF
              </Copy>
            </Pressable>
            <Button
              title="Export client PDF"
              disabled={busy}
              icon="share-outline"
              onPress={() =>
                run(() => exportPDF("client", row, data, includeInternal))
              }
            />
            {row.status === "ACCEPTED" && !row.projectId && (
              <Button
                title="Convert to project"
                disabled={busy}
                secondary
                icon="layers-outline"
                onPress={convert}
              />
            )}
            {row.projectId && (
              <Copy color={colors.green}>Already linked to a project.</Copy>
            )}
          </>
        )}
        {entity === "projects" && (
          <>
            <View style={s.divider} />
            {related(
              "Technology stack",
              "projectTechnologies",
              linked("projectTechnologies", "projectId"),
              { projectId: row.id },
            )}
            {related(
              "Services",
              "projectServices",
              linked("projectServices", "projectId"),
              { projectId: row.id },
            )}
            {related("Payments", "payments", linked("payments", "projectId"), {
              projectId: row.id,
              currency: String(row.currency),
            })}
            {related("Expenses", "expenses", linked("expenses", "projectId"), {
              projectId: row.id,
              currency: String(row.currency),
            })}
            <Card style={{ gap: 8 }}>
              {Object.entries(
                revenue(
                  linked("payments", "projectId").filter(
                    (p) => p.currency === row.currency,
                  ),
                  linked("expenses", "projectId").filter(
                    (p) => p.currency === row.currency,
                  ),
                ),
              ).map(([key, value]) => (
                <View key={key} style={s.between}>
                  <Copy color={colors.muted}>{key}</Copy>
                  <Copy bold>{money(value, String(row.currency))}</Copy>
                </View>
              ))}
            </Card>
            {row.status === "COMPLETED" && (
              <Button
                title="Add to portfolio"
                disabled={
                  busy || data.portfolio.some((p) => p.projectId === row.id)
                }
                icon="briefcase-outline"
                onPress={() =>
                  run(async () => {
                    await store.repository("portfolio").save(
                      valuesToRow(
                        "portfolio",
                        {
                          ...initialValues("portfolio"),
                          projectId: row.id,
                          clientId: String(row.clientId || ""),
                          title: String(row.title),
                          description: String(row.description || ""),
                          featuredImage: String(row.featuredImage || ""),
                        },
                        id(),
                      ),
                    );
                    notify("Added to your private portfolio.");
                  })
                }
              />
            )}
          </>
        )}
        {entity === "clients" && (
          <>
            <Heading size={18}>Client history</Heading>
            {(["projects", "proposals"] as const).map((name) => (
              <View key={name} style={{ gap: 10 }}>
                <Copy color={colors.muted}>{definitions[name].title}</Copy>
                {data[name]
                  .filter((p) => p.clientId === row.id)
                  .map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        onClose();
                        router.push(("/" + name + "?detail=" + p.id) as "/");
                      }}
                    >
                      <Card style={{ padding: 12 }}>
                        <Copy>{label(p)} ↗</Copy>
                      </Card>
                    </Pressable>
                  ))}
              </View>
            ))}
            {[
              ...new Set(
                data.payments
                  .filter((p) =>
                    data.projects.some(
                      (project) =>
                        project.id === p.projectId &&
                        project.clientId === row.id,
                    ),
                  )
                  .map((p) => String(p.currency)),
              ),
            ].map((currency) => (
              <Copy key={currency} color={colors.green}>
                Revenue ·{" "}
                {money(
                  revenue(
                    data.payments.filter(
                      (p) =>
                        p.currency === currency &&
                        data.projects.some(
                          (project) =>
                            project.id === p.projectId &&
                            project.clientId === row.id,
                        ),
                    ),
                    [],
                  ).received,
                  currency,
                )}
              </Copy>
            ))}
          </>
        )}
        {entity === "portfolio" && row.projectId && (
          <>
            <Heading size={18}>Project context</Heading>
            <Copy color={colors.muted}>
              {data.projectTechnologies
                .filter((p) => p.projectId === row.projectId)
                .map(
                  (p) =>
                    data.technologies.find((t) => t.id === p.technologyId)
                      ?.name,
                )
                .filter(Boolean)
                .join(" · ") || "No technologies linked"}
            </Copy>
            <Copy color={colors.muted}>
              {data.projectServices
                .filter((p) => p.projectId === row.projectId)
                .map(
                  (p) => data.services.find((t) => t.id === p.serviceId)?.name,
                )
                .filter(Boolean)
                .join(" · ") || "No services linked"}
            </Copy>
            {row.showRevenue === "YES" && (
              <Copy>
                Revenue:{" "}
                {money(
                  revenue(
                    data.payments.filter(
                      (p) =>
                        p.projectId === row.projectId &&
                        p.currency ===
                          data.projects.find((p) => p.id === row.projectId)
                            ?.currency,
                    ),
                    [],
                  ).received,
                  String(
                    data.projects.find((p) => p.id === row.projectId)
                      ?.currency || "EUR",
                  ),
                )}
              </Copy>
            )}
          </>
        )}
      </Sheet>
      {form && (
        <EntityForm
          key={form.entity + (form.row?.id || "new")}
          entity={form.entity}
          original={form.row}
          defaults={form.defaults}
          onClose={() => setForm(undefined)}
        />
      )}
      <Confirm
        visible={deleting}
        title={"Delete this " + definitions[entity].singular + "?"}
        message="This cannot be undone. Linked records must be removed first. Export a backup if you may need this data later."
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          setDeleting(false);
          void run(async () => {
            await store.repository(entity).remove(row.id);
            notify("Record deleted.");
            onClose();
          });
        }}
      />
    </>
  );
}
