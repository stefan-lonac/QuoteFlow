import React, { useState } from "react";
import { allReceipts } from "../src/domain/maintenance";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useData } from "../src/data/context";
import { money, paymentStatus, revenue } from "../src/domain/calculations";
import {
  Badge,
  Button,
  Card,
  Copy,
  Heading,
  Skeleton,
  colors,
  s,
} from "../src/components/ui";
export default function Revenue() {
  const { data } = useData();
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [period, setPeriod] = useState("ALL");
  if (!data) return <Skeleton />;
  const currencies = [
    ...new Set([
      String(data.profile[0]?.currency || "EUR"),
      ...allReceipts(data).map((p) => String(p.currency)),
      ...data.expenses.map((p) => String(p.currency)),
    ]),
  ];
  const currency = selected || currencies[0]!;
  const now = new Date().toISOString();
  const matches = (date: unknown) =>
    period === "ALL" ||
    String(date).startsWith(now.slice(0, period === "MONTH" ? 7 : 4));
  const payments = allReceipts(data).filter(
    (p) => p.currency === currency && matches(p.date),
  );
  const expenses = data.expenses.filter(
    (e) => e.currency === currency && matches(e.date),
  );
  const totals = revenue(payments, expenses);
  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 7 }}>
        <Copy color={colors.green} size={10} bold style={{ letterSpacing: 2 }}>
          YOUR FINANCIAL PICTURE
        </Copy>
        <Heading>Good work. Healthy business.</Heading>
        <Copy color={colors.muted}>
          Recorded receipts, expenses and profit. Each currency stays separate.
        </Copy>
      </View>
      <View style={s.chips}>
        {currencies.map((c) => (
          <Button
            key={c}
            title={c}
            secondary={c !== currency}
            small
            onPress={() => setSelected(c)}
          />
        ))}
        {["ALL", "YEAR", "MONTH"].map((p) => (
          <Button
            key={p}
            title={p === "ALL" ? "All time" : "This " + p.toLowerCase()}
            secondary={p !== period}
            small
            onPress={() => setPeriod(p)}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {Object.entries(totals).map(([name, amount]) => (
          <Card key={name} style={{ flex: 1, minWidth: 140, gap: 12 }}>
            <Copy color={colors.muted} size={12}>
              {name.toUpperCase()}
            </Copy>
            <Heading size={25}>{money(amount, currency)}</Heading>
          </Card>
        ))}
      </View>
      <View style={[s.row, { flexWrap: "wrap" }]}>
        <Button
          title="Client maintenance"
          secondary
          icon="repeat-outline"
          onPress={() => router.push("/maintenanceContracts")}
        />
        <Button
          title="Record payment"
          icon="add"
          onPress={() => router.push("/payments?new=1")}
        />
        <Button
          title="Add expense"
          secondary
          icon="add"
          onPress={() => router.push("/expenses?new=1")}
        />
      </View>
      <Card style={{ gap: 16 }}>
        <View style={s.between}>
          <Heading size={18}>Payments</Heading>
          <Pressable onPress={() => router.push("/payments")}>
            <Copy color={colors.purple}>View all ↗</Copy>
          </Pressable>
        </View>
        {payments.length ? (
          payments.map((p) => (
            <Pressable
              key={p.id}
              onPress={() =>
                router.push(
                  ((p.source === "maintenance"
                    ? "/maintenanceReceipts"
                    : "/payments") +
                    "?detail=" +
                    p.id) as "/",
                )
              }
              style={[
                s.between,
                {
                  borderTopWidth: 1,
                  borderTopColor: colors.line,
                  paddingTop: 14,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Copy bold size={13}>
                  {p.title}
                </Copy>
                <Copy color={colors.muted} size={11}>
                  {money(Number(p.paidAmount), currency)} received of{" "}
                  {money(Number(p.amount), currency)}
                </Copy>
              </View>
              <Badge value={paymentStatus(p)} />
            </Pressable>
          ))
        ) : (
          <Copy color={colors.muted}>No payments in this period.</Copy>
        )}
      </Card>
      <Card style={{ gap: 16 }}>
        <View style={s.between}>
          <Heading size={18}>Expenses</Heading>
          <Pressable onPress={() => router.push("/expenses")}>
            <Copy color={colors.purple}>View all ↗</Copy>
          </Pressable>
        </View>
        {expenses.length ? (
          expenses.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => router.push(("/expenses?detail=" + e.id) as "/")}
              style={s.between}
            >
              <Copy>{e.title}</Copy>
              <Copy color={colors.amber}>
                {money(Number(e.amount), currency)}
              </Copy>
            </Pressable>
          ))
        ) : (
          <Copy color={colors.muted}>No expenses in this period.</Copy>
        )}
      </Card>
      <Copy size={11} color={colors.muted}>
        Payment date is the receipt date. For installments received on different
        dates, create separate payment records to keep monthly totals accurate.
      </Copy>
    </View>
  );
}
