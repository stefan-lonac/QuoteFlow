import React, { useEffect, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  definitions,
  entityNames,
  fieldsFor,
  label,
  type EntityName,
} from "../src/domain/catalog";
import {
  calculateEstimate,
  money,
  paymentStatus,
} from "../src/domain/calculations";
import { useData } from "../src/data/context";
import { EntityForm } from "../src/components/EntityForm";
import { EntityDetail } from "../src/components/EntityDetail";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Copy,
  Empty,
  FadeIn,
  Heading,
  Icon,
  Search,
  Skeleton,
  colors,
  s,
} from "../src/components/ui";
import { multipliersFrom } from "../src/services/pdf";
export default function EntityScreen() {
  const params = useLocalSearchParams<{
    entity: string;
    new?: string;
    detail?: string;
  }>();
  const entity = params.entity as EntityName;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data, isPending, error } = useData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [form, setForm] = useState(false);
  const [detail, setDetail] = useState<string>();
  useEffect(() => {
    setSearch("");
    setFilter("ALL");
    setForm(params.new === "1");
    setDetail(params.detail);
  }, [entity, params.new, params.detail]);
  const closeForm = () => {
    setForm(false);
    router.setParams({ new: "" });
  };
  const closeDetail = () => {
    setDetail(undefined);
    router.setParams({ detail: "" });
  };
  if (
    !entityNames.includes(entity) ||
    ["settings", "files", "profile"].includes(entity)
  )
    return (
      <Empty
        title="Page not found"
        subtitle="Find your next step in the workspace."
        action="Go home"
        onPress={() => router.replace("/")}
      />
    );
  if (isPending) return <Skeleton />;
  if (!data || error)
    return <Empty title="Could not load records" subtitle={String(error)} />;
  const def = definitions[entity];
  const statuses =
    fieldsFor(entity).find((f) => f.key === "status")?.options ||
    (entity === "payments"
      ? ["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE"]
      : []);
  const rows = data[entity].filter(
    (row) =>
      (filter === "ALL" ||
        (entity === "payments" ? paymentStatus(row) : row.status) === filter) &&
      Object.values(row).some((v) =>
        String(v || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
  );
  return (
    <View style={{ gap: 25 }}>
      <FadeIn>
        <View style={[s.between, { flexWrap: "wrap" }]}>
          <View style={{ gap: 6, flexShrink: 1, maxWidth: "100%" }}>
            <Copy
              color={colors.purple}
              size={10}
              bold
              style={{ letterSpacing: 2 }}
            >
              YOUR WORKSPACE
            </Copy>
            <Heading size={32}>
              {def.title}
              <Copy size={16} color={colors.muted}>
                {" "}
                / {data[entity].length}
              </Copy>
            </Heading>
            <Copy color={colors.muted}>{def.description}</Copy>
          </View>
          <Button
            title={"New " + def.singular}
            icon="add"
            onPress={() => setForm(true)}
          />
        </View>
      </FadeIn>
      <Search
        value={search}
        onChangeText={setSearch}
        placeholder={"Search " + def.title.toLowerCase() + "…"}
      />
      {!!statuses.length && (
        <View style={s.chips}>
          {["ALL", ...statuses].map((status) => (
            <Pressable
              key={status}
              onPress={() => setFilter(status)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 9,
                backgroundColor: filter === status ? "#bca3ff1a" : colors.panel,
                borderWidth: 1,
                borderColor: filter === status ? "#8b70ac" : colors.line,
              }}
            >
              <Copy
                size={11}
                color={filter === status ? colors.purple : colors.muted}
              >
                {status.toLowerCase().replaceAll("_", " ")}
              </Copy>
            </Pressable>
          ))}
        </View>
      )}
      {rows.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {rows.map((row, index) => {
            const client = data.clients.find((c) => c.id === row.clientId);
            const status =
              entity === "payments" ? paymentStatus(row) : row.status;
            const amount =
              entity === "estimates"
                ? calculateEstimate(
                    row,
                    data.estimateItems.filter((i) => i.estimateId === row.id),
                    multipliersFrom(data),
                  ).finalPrice
                : (row.finalPrice ??
                  row.price ??
                  row.amount ??
                  row.monthlyPrice);
            return (
              <FadeIn
                key={row.id}
                delay={Math.min(index * 45, 300)}
                style={{
                  width:
                    width >= 1300 ? "31.8%" : width >= 700 ? "48.5%" : "100%",
                  flexGrow: 1,
                }}
              >
                <Pressable
                  onPress={() => setDetail(row.id)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
                >
                  <Card style={{ gap: 18, minHeight: 185 }}>
                    <View style={s.between}>
                      <Avatar name={label(row)} index={index} />
                      {status ? (
                        <Badge value={String(status)} />
                      ) : (
                        <Icon name={def.icon} size={18} />
                      )}
                    </View>
                    <View style={{ gap: 5 }}>
                      <Copy size={16} bold>
                        {label(row)}
                      </Copy>
                      <Copy color={colors.muted} size={12}>
                        {client?.company ||
                          client?.name ||
                          row.company ||
                          row.category ||
                          row.professionalTitle ||
                          row.description ||
                          row.email ||
                          def.singular}
                      </Copy>
                    </View>
                    <View
                      style={[
                        s.between,
                        {
                          borderTopWidth: 1,
                          borderTopColor: colors.line,
                          paddingTop: 14,
                        },
                      ]}
                    >
                      <Copy
                        color={amount != null ? colors.purple : colors.muted}
                        bold={amount != null}
                        size={13}
                      >
                        {amount != null
                          ? money(
                              Number(amount),
                              String(
                                row.currency ||
                                  data.profile[0]?.currency ||
                                  "EUR",
                              ),
                            )
                          : row.email || "View details"}
                      </Copy>
                      <Icon name="arrow-forward" size={16} />
                    </View>
                  </Card>
                </Pressable>
              </FadeIn>
            );
          })}
        </View>
      ) : (
        <Empty
          title={
            search || filter !== "ALL"
              ? "No matching results"
              : "Room for something great"
          }
          subtitle={
            search || filter !== "ALL"
              ? "Try a different search or status filter."
              : "Create your first " +
                def.singular +
                ". Everything is saved on your device."
          }
          action={
            search || filter !== "ALL" ? "Clear filters" : "Add " + def.singular
          }
          onPress={() => {
            if (search || filter !== "ALL") {
              setSearch("");
              setFilter("ALL");
            } else setForm(true);
          }}
        />
      )}
      {form && <EntityForm key={entity} entity={entity} onClose={closeForm} />}
      {detail && (
        <EntityDetail
          key={entity + detail}
          entity={entity}
          rowId={detail}
          onClose={closeDetail}
        />
      )}
    </View>
  );
}
