import React, { useState } from "react";
import { allReceipts } from "../src/domain/maintenance";
import { Pressable, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useData, useRefresh, useStore } from "../src/data/context";
import { loadDemo } from "../src/data/demo";
import { money, revenue } from "../src/domain/calculations";
import { useUI } from "../src/state";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Confirm,
  Copy,
  Empty,
  FadeIn,
  Heading,
  Icon,
  Skeleton,
  colors,
  s,
} from "../src/components/ui";
export default function Dashboard() {
  const { data, isPending, error } = useData();
  const { width } = useWindowDimensions();
  const wide = width >= 1200;
  const router = useRouter();
  const store = useStore();
  const refresh = useRefresh();
  const notify = useUI((x) => x.notify);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  if (isPending) return <Skeleton />;
  if (!data || error)
    return (
      <Empty
        title="Could not load your workspace"
        subtitle={String(error)}
        action="Try again"
        onPress={refresh}
      />
    );
  const profile = data.profile[0];
  const currency = String(profile?.currency || "EUR");
  const payments = allReceipts(data).filter((p) => p.currency === currency);
  const expenses = data.expenses.filter((p) => p.currency === currency);
  const totals = revenue(payments, expenses);
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const year = String(now.getFullYear());
  const monthly = revenue(
    payments.filter((p) => String(p.date).startsWith(month)),
    [],
  ).received;
  const yearly = revenue(
    payments.filter((p) => String(p.date).startsWith(year)),
    [],
  ).received;
  const active = data.projects.filter((p) =>
    ["IN_PROGRESS", "ACCEPTED"].includes(String(p.status)),
  );
  const open = data.proposals.filter((p) =>
    ["SENT", "DRAFT"].includes(String(p.status)),
  );
  const accepted = data.proposals.filter((p) => p.status === "ACCEPTED");
  const decided = data.proposals.filter((p) =>
    ["ACCEPTED", "REJECTED", "EXPIRED"].includes(String(p.status)),
  );
  const conversion = decided.length
    ? Math.round((accepted.length / decided.length) * 100)
    : 0;
  const projects = data.projects.filter((p) => p.currency === currency);
  const average = projects.length
    ? projects.reduce(
        (sum, p) => sum + Number(p.finalPrice || p.estimatedPrice || 0),
        0,
      ) / projects.length
    : 0;
  const bars = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const prefix =
      date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
    return {
      label: date.toLocaleString("en", { month: "short" }),
      ...revenue(
        payments.filter((p) => String(p.date).startsWith(prefix)),
        expenses.filter((p) => String(p.date).startsWith(prefix)),
      ),
    };
  });
  const max = Math.max(1, ...bars.map((b) => Math.max(b.received, b.expenses)));
  const go = (path: string) => router.push(path as "/");
  return (
    <View style={{ gap: 28 }}>
      <FadeIn>
        <View
          style={[s.between, { alignItems: "flex-start", flexWrap: "wrap" }]}
        >
          <View style={{ gap: 8, flexShrink: 1, maxWidth: "100%" }}>
            <View style={[s.row, { gap: 7 }]}>
              <Icon name="sunny-outline" size={15} color={colors.amber} />
              <Copy size={11} color={colors.muted}>
                {now.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Copy>
            </View>
            <Heading size={width < 500 ? 27 : 32}>
              A little clarity. A lot of possibility.
            </Heading>
            <Copy color={colors.muted}>
              Welcome
              {profile?.firstName
                ? " back, " + profile.firstName
                : " to your workspace"}
              . Let’s make good work happen.
            </Copy>
          </View>
          <Button
            title="New estimate"
            icon="add"
            onPress={() => go("/estimates?new=1")}
          />
        </View>
      </FadeIn>
      <FadeIn delay={70}>
        <LinearGradient
          colors={["#30243e", "#241e30", "#1e202b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            padding: width < 500 ? 23 : 28,
            borderWidth: 1,
            borderColor: "#493754",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              right: -40,
              top: -95,
              width: 310,
              height: 310,
              borderWidth: 1,
              borderColor: "#bca3ff18",
              borderRadius: 170,
            }}
          />
          <View
            style={{
              position: "absolute",
              right: 10,
              top: -45,
              width: 210,
              height: 210,
              borderWidth: 1,
              borderColor: "#bca3ff22",
              borderRadius: 120,
            }}
          />
          <View style={s.between}>
            <View style={{ gap: 9, flex: 1 }}>
              <Copy
                size={10}
                color={colors.purple}
                bold
                style={{ letterSpacing: 2 }}
              >
                BUILT FOR YOUR INDEPENDENCE
              </Copy>
              <Heading size={24}>Less admin. More of what you love.</Heading>
              <Copy size={13} color="#b5a9c3" style={{ maxWidth: 480 }}>
                From your first estimate to your next big project. Your
                freelance business, beautifully in flow.
              </Copy>
              <Pressable
                onPress={() => go("/estimates?new=1")}
                style={[s.row, { marginTop: 6, gap: 8 }]}
              >
                <Copy size={12} color={colors.purple} bold>
                  Create an estimate
                </Copy>
                <Icon name="arrow-forward" size={15} color={colors.purple} />
              </Pressable>
            </View>
            {width > 700 && (
              <View
                style={{
                  padding: 22,
                  transform: [{ rotate: "-8deg" }],
                  borderWidth: 1,
                  borderColor: "#82709266",
                  borderRadius: 22,
                  backgroundColor: "#bc9eee14",
                  marginRight: 38,
                }}
              >
                <Icon name="flash-outline" color="#d7bfff" size={54} />
              </View>
            )}
          </View>
        </LinearGradient>
      </FadeIn>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {[
          {
            label: "Revenue this month",
            value: money(monthly, currency),
            foot: money(yearly, currency) + " this year",
            icon: "wallet-outline",
            color: colors.green,
            path: "/revenue",
          },
          {
            label: "Active projects",
            value: String(active.length).padStart(2, "0"),
            foot:
              data.projects.filter((p) => p.status === "COMPLETED").length +
              " projects completed",
            icon: "layers-outline",
            color: colors.purple,
            path: "/projects",
          },
          {
            label: "Open proposals",
            value: String(open.length).padStart(2, "0"),
            foot: accepted.length + " proposals accepted",
            icon: "document-text-outline",
            color: colors.amber,
            path: "/proposals",
          },
          {
            label: "Outstanding",
            value: money(totals.outstanding, currency),
            foot: "A little nudge goes a long way",
            icon: "time-outline",
            color: "#90bdf4",
            path: "/payments",
          },
        ].map((stat, i) => (
          <FadeIn
            key={stat.label}
            delay={100 + i * 50}
            style={{ flexGrow: 1, flexBasis: width < 600 ? "44%" : "21%" }}
          >
            <Pressable onPress={() => go(stat.path)}>
              <Card
                style={{
                  padding: width < 500 ? 16 : 21,
                  gap: 15,
                  minHeight: 157,
                }}
              >
                <View style={s.between}>
                  <Copy size={11} color={colors.muted}>
                    {stat.label}
                  </Copy>
                  <Icon name={stat.icon} color={stat.color} size={18} />
                </View>
                <Heading size={width < 500 ? 23 : 29}>{stat.value}</Heading>
                <Copy size={10} color={i === 0 ? colors.green : colors.muted}>
                  {stat.foot}
                </Copy>
              </Card>
            </Pressable>
          </FadeIn>
        ))}
      </View>
      <View style={{ flexDirection: wide ? "row" : "column", gap: 22 }}>
        <FadeIn delay={250} style={{ flex: 1.7 }}>
          <Card style={{ gap: 22 }}>
            <View style={s.between}>
              <View>
                <Heading size={18}>The bigger picture</Heading>
                <Copy size={11} color={colors.muted}>
                  Your last six months, at a glance · {currency}
                </Copy>
              </View>
              <Icon name="calendar-outline" size={17} />
            </View>
            <View
              style={{
                height: 176,
                flexDirection: "row",
                gap: 12,
                alignItems: "flex-end",
                paddingTop: 12,
              }}
            >
              {bars.map((bar, i) => (
                <View
                  key={bar.label}
                  style={{ flex: 1, alignItems: "center", gap: 9 }}
                >
                  <Copy size={9} color={colors.muted}>
                    {bar.received ? money(bar.received, currency) : "—"}
                  </Copy>
                  <View
                    style={{
                      height: 120,
                      flexDirection: "row",
                      gap: 4,
                      alignItems: "flex-end",
                      justifyContent: "center",
                      width: "100%",
                      borderBottomWidth: 1,
                      borderBottomColor: colors.line,
                    }}
                  >
                    <View
                      style={{
                        width: "37%",
                        maxWidth: 34,
                        height: Math.max(3, (bar.received / max) * 120),
                        backgroundColor: i === 5 ? colors.purple : "#776194",
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                      }}
                    />
                    <View
                      style={{
                        width: "18%",
                        maxWidth: 15,
                        height: Math.max(3, (bar.expenses / max) * 120),
                        backgroundColor: "#4b485b",
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }}
                    />
                  </View>
                  <Copy size={10} color={colors.muted}>
                    {bar.label}
                  </Copy>
                </View>
              ))}
            </View>
            <View
              style={[
                s.between,
                { borderTopWidth: 1, borderColor: colors.line, paddingTop: 18 },
              ]}
            >
              <View style={s.row}>
                <Copy size={10} color={colors.purple}>
                  ● Revenue
                </Copy>
                <Copy size={10} color={colors.muted}>
                  ● Expenses
                </Copy>
              </View>
              <Pressable onPress={() => go("/revenue")}>
                <Copy size={11} color={colors.purple}>
                  View finances ↗
                </Copy>
              </Pressable>
            </View>
          </Card>
        </FadeIn>
        <FadeIn delay={300} style={{ flex: 1 }}>
          <Card style={{ flex: 1, gap: 22 }}>
            <Heading size={18}>Small steps, big things</Heading>
            {[
              {
                icon: "calculator-outline",
                title: "Create an estimate",
                subtitle: "Give your next idea a number",
                path: "/estimates?new=1",
                color: colors.purple,
              },
              {
                icon: "person-add-outline",
                title: "Add a new client",
                subtitle: "Start a new relationship",
                path: "/clients?new=1",
                color: colors.green,
              },
              {
                icon: "document-text-outline",
                title: "Craft a proposal",
                subtitle: "Make your next great impression",
                path: "/proposals?new=1",
                color: colors.amber,
              },
            ].map((action) => (
              <Pressable
                key={action.title}
                onPress={() => go(action.path)}
                style={s.row}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: action.color + "12",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={action.icon} color={action.color} size={20} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Copy bold size={12}>
                    {action.title}
                  </Copy>
                  <Copy size={10} color={colors.muted}>
                    {action.subtitle}
                  </Copy>
                </View>
                <Icon name="arrow-forward" size={15} />
              </Pressable>
            ))}
            <View style={s.divider} />
            <View style={s.between}>
              <Copy color={colors.muted} size={11}>
                Proposal conversion
              </Copy>
              <Copy color={colors.green} bold>
                {conversion}%
              </Copy>
            </View>
            <View
              style={{
                height: 4,
                backgroundColor: colors.raised,
                borderRadius: 4,
              }}
            >
              <View
                style={{
                  width: (conversion + "%") as `${number}%`,
                  height: 4,
                  borderRadius: 4,
                  backgroundColor: colors.green,
                }}
              />
            </View>
          </Card>
        </FadeIn>
      </View>
      <FadeIn delay={350}>
        <View style={{ gap: 16 }}>
          <View style={s.between}>
            <Heading size={19}>
              Work in motion{" "}
              <Copy size={12} color={colors.muted}>
                {" "}
                / {active.length}
              </Copy>
            </Heading>
            <Pressable onPress={() => go("/projects")}>
              <Copy color={colors.purple} size={12}>
                All projects ↗
              </Copy>
            </Pressable>
          </View>
          {data.projects.length ? (
            <View
              style={{ flexDirection: width > 750 ? "row" : "column", gap: 16 }}
            >
              {data.projects.slice(0, 3).map((p, i) => {
                const client = data.clients.find((c) => c.id === p.clientId);
                const progress = Math.min(
                  100,
                  p.status === "COMPLETED"
                    ? 100
                    : Number(p.estimatedHours)
                      ? Math.round(
                          (Number(p.actualHours) / Number(p.estimatedHours)) *
                            100,
                        )
                      : 0,
                );
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => go("/projects?detail=" + p.id)}
                    style={{ flex: 1 }}
                  >
                    <Card style={{ gap: 17 }}>
                      <View style={s.between}>
                        <Avatar
                          name={String(client?.company || p.title)}
                          index={i}
                        />
                        <Badge value={String(p.status)} />
                      </View>
                      <View style={{ gap: 4 }}>
                        <Copy size={14} bold>
                          {p.title}
                        </Copy>
                        <Copy color={colors.muted} size={11}>
                          {client?.company ||
                            client?.name ||
                            "Independent project"}
                        </Copy>
                      </View>
                      <View
                        style={{
                          height: 4,
                          backgroundColor: colors.raised,
                          borderRadius: 4,
                        }}
                      >
                        <View
                          style={{
                            height: 4,
                            width: (progress + "%") as `${number}%`,
                            backgroundColor: [
                              colors.purple,
                              colors.green,
                              colors.amber,
                            ][i],
                            borderRadius: 4,
                          }}
                        />
                      </View>
                      <View style={s.between}>
                        <Copy color={colors.muted} size={10}>
                          {progress}% of estimated hours
                        </Copy>
                        <Copy bold size={12}>
                          {money(
                            Number(p.finalPrice || p.estimatedPrice || 0),
                            String(p.currency),
                          )}
                        </Copy>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Empty
              title="Your next chapter starts here"
              subtitle="Add a client and a project, or explore the workspace with optional sample data."
              action="Create your first project"
              onPress={() => go("/projects?new=1")}
            />
          )}
        </View>
      </FadeIn>
      <View style={{ flexDirection: width > 750 ? "row" : "column", gap: 20 }}>
        <Card style={{ flex: 1.6, gap: 16 }}>
          <View style={s.between}>
            <Heading size={18}>Recent proposals</Heading>
            <Pressable onPress={() => go("/proposals")}>
              <Copy size={11} color={colors.purple}>
                View all ↗
              </Copy>
            </Pressable>
          </View>
          {data.proposals.length ? (
            data.proposals.slice(0, 3).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => go("/proposals?detail=" + p.id)}
                style={[
                  s.between,
                  {
                    borderTopWidth: 1,
                    borderColor: colors.line,
                    paddingTop: 14,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Copy size={12} bold>
                    {p.title}
                  </Copy>
                  <Copy size={10} color={colors.muted}>
                    {p.number} · {money(Number(p.price), String(p.currency))}
                  </Copy>
                </View>
                <Badge value={String(p.status)} />
              </Pressable>
            ))
          ) : (
            <Copy size={12} color={colors.muted}>
              Your proposals will appear here. Start with a clear scope and a
              thoughtful offer.
            </Copy>
          )}
        </Card>
        <Card style={{ flex: 1, gap: 13 }}>
          <Copy size={11} color={colors.muted}>
            AVERAGE PROJECT VALUE
          </Copy>
          <Heading size={28}>{money(average, currency)}</Heading>
          <Copy color={colors.muted} size={11}>
            Across {projects.length} projects in {currency}. Keep building work
            you’re proud of.
          </Copy>
          <View style={s.divider} />
          <Copy color={colors.green} size={12}>
            All-time profit · {money(totals.profit, currency)}
          </Copy>
        </Card>
      </View>
      {!data.clients.length && (
        <Button
          title={
            busy ? "Creating sample workspace…" : "Explore with sample data"
          }
          secondary
          icon="sparkles-outline"
          disabled={busy}
          onPress={() => setDemo(true)}
        />
      )}
      <View style={{ alignItems: "center", gap: 4, paddingTop: 2 }}>
        <Copy color="#615e6e" size={10}>
          MADE FOR THE WAY YOU WORK
        </Copy>
        <Copy color="#615e6e" size={10}>
          Local-first. Quietly powerful. Entirely yours.
        </Copy>
      </View>
      <Confirm
        visible={demo}
        title="Explore a sample workspace?"
        message="This adds fictional clients, projects and payments to your local data. You can remove them individually. Export a backup first if you want to return to your current workspace."
        onClose={() => setDemo(false)}
        onConfirm={async () => {
          setDemo(false);
          setBusy(true);
          try {
            await loadDemo(store);
            await refresh();
            notify("Sample workspace is ready. Make yourself at home.");
          } catch (e) {
            notify(String(e));
          } finally {
            setBusy(false);
          }
        }}
      />
    </View>
  );
}
