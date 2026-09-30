import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useData } from "../src/data/context";
import { EntityForm } from "../src/components/EntityForm";
import { EntityDetail } from "../src/components/EntityDetail";
import {
  Badge,
  Button,
  Card,
  Copy,
  FadeIn,
  Heading,
  Skeleton,
  colors,
  s,
} from "../src/components/ui";
import {
  localDate,
  maintenanceMonths,
  maintenanceStatus,
} from "../src/domain/maintenance";
import { money, round } from "../src/domain/calculations";
import type { Row } from "../src/domain/catalog";

export default function ClientMaintenance() {
  const { data } = useData();
  const params = useLocalSearchParams<{ detail?: string; new?: string }>();
  const [creating, setCreating] = useState(params.new === "1");
  const [detail, setDetail] = useState<string | undefined>(params.detail);
  const [receipt, setReceipt] = useState<Row>();
  const [currencyChoice, setCurrency] = useState("");
  const [client, setClient] = useState("");
  const [status, setStatus] = useState("ALL");
  const [month, setMonth] = useState(localDate().slice(0, 7));
  if (!data) return <Skeleton />;
  const currencies = [
    ...new Set([
      String(data.profile[0]?.currency || "EUR"),
      ...data.maintenanceContracts.map((r) => String(r.currency)),
      ...data.maintenanceReceipts.map((r) => String(r.currency)),
    ]),
  ];
  const currency = currencyChoice || currencies[0]!;
  const contracts = data.maintenanceContracts.filter(
    (r) => r.currency === currency && (!client || r.clientId === client),
  );
  const ids = new Set(contracts.map((r) => r.id));
  const receipts = data.maintenanceReceipts.filter(
    (r) => ids.has(String(r.contractId)) && r.currency === currency,
  );
  const months = maintenanceMonths(contracts, currency);
  const accrued = round(months.reduce((sum, m) => sum + m.accrued, 0));
  const received = round(
    receipts.reduce((sum, r) => sum + Number(r.paidAmount || 0), 0),
  );
  const monthReceived = round(
    receipts
      .filter((r) => String(r.date).startsWith(month))
      .reduce((sum, r) => sum + Number(r.paidAmount || 0), 0),
  );
  const monthAccrued = months.find((m) => m.month === month)?.accrued || 0;
  const shown = contracts.filter(
    (r) => status === "ALL" || maintenanceStatus(r) === status,
  );
  const moveMonth = (delta: number) => {
    const d = new Date(
      Number(month.slice(0, 4)),
      Number(month.slice(5, 7)) - 1 + delta,
      1,
    );
    setMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  };
  return (
    <View style={{ gap: 22 }}>
      <FadeIn>
        <View style={{ gap: 8 }}>
          <Copy color={colors.purple} bold>
            RECURRING WORK
          </Copy>
          <Heading>Care that pays off.</Heading>
          <Copy color={colors.muted}>
            Client maintenance, from the first day to the final payment.
          </Copy>
        </View>
      </FadeIn>
      <View style={s.chips}>
        <Button
          title="New agreement"
          icon="add"
          onPress={() => setCreating(true)}
        />
        {currencies.map((c) => (
          <Button
            key={c}
            small
            title={c}
            secondary={c !== currency}
            onPress={() => setCurrency(c)}
          />
        ))}
      </View>
      <View style={s.chips}>
        <Button
          small
          title="All clients"
          secondary={!!client}
          onPress={() => setClient("")}
        />
        {data.clients.map((c) => (
          <Button
            key={c.id}
            small
            title={String(c.name)}
            secondary={client !== c.id}
            onPress={() => setClient(c.id)}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[
          ["Accrued to date", accrued],
          ["Received · all time", received],
          ["Uncollected balance", Math.max(0, round(accrued - received))],
        ].map(([name, value]) => (
          <Card key={String(name)} style={{ flex: 1, minWidth: 150, gap: 8 }}>
            <Copy color={colors.muted} size={12}>
              {name}
            </Copy>
            <Heading size={24}>{money(Number(value), currency)}</Heading>
          </Card>
        ))}
      </View>
      <Card style={{ gap: 16 }}>
        <View style={s.between}>
          <Button
            small
            secondary
            title="Previous"
            onPress={() => moveMonth(-1)}
          />
          <Heading size={20}>{month}</Heading>
          <Button small secondary title="Next" onPress={() => moveMonth(1)} />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 24 }}>
          <View>
            <Copy color={colors.muted}>Accrued</Copy>
            <Heading size={23}>{money(monthAccrued, currency)}</Heading>
          </View>
          <View>
            <Copy color={colors.green}>Received</Copy>
            <Heading size={23}>{money(monthReceived, currency)}</Heading>
          </View>
        </View>
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.line,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 6,
              backgroundColor: colors.purple,
              width: (Math.min(
                100,
                monthAccrued ? (monthReceived / monthAccrued) * 100 : 0,
              ) + "%") as `${number}%`,
            }}
          />
        </View>
        <Copy color={colors.muted} size={12}>
          Fees accrue daily through today. Partial months are prorated; the end
          date is inclusive. Received income follows the actual payment date,
          including advance or late payments.
        </Copy>
      </Card>
      <View style={s.chips}>
        {["ALL", "ACTIVE", "SCHEDULED", "ENDED"].map((value) => (
          <Button
            key={value}
            small
            title={value.toLowerCase()}
            secondary={value !== status}
            onPress={() => setStatus(value)}
          />
        ))}
      </View>
      {!shown.length && (
        <Card>
          <Copy color={colors.muted}>
            No agreements here yet. Add a client and their monthly maintenance
            fee to get started.
          </Copy>
        </Card>
      )}
      {shown.map((r, i) => {
        const paid = receipts
          .filter((p) => p.contractId === r.id)
          .reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);
        return (
          <FadeIn key={r.id} delay={Math.min(i * 40, 240)}>
            <Card style={{ gap: 14 }}>
              <Pressable
                accessibilityLabel={"Open " + r.title}
                onPress={() => setDetail(r.id)}
                style={{ gap: 8 }}
              >
                <View style={s.between}>
                  <Heading size={19}>{r.title}</Heading>
                  <Badge value={maintenanceStatus(r)} />
                </View>
                <Copy color={colors.muted}>
                  {data.clients.find((c) => c.id === r.clientId)?.name}
                </Copy>
                <Copy bold color={colors.purple}>
                  {money(Number(r.monthlyPrice || 0), currency)} / month
                </Copy>
                <Copy size={12}>
                  {r.startDate} → {r.endDate || "Ongoing"}
                </Copy>
                <Copy size={12} color={colors.green}>
                  {money(paid, currency)} received in total
                </Copy>
              </Pressable>
              <View style={s.chips}>
                <Button
                  small
                  title="Record receipt"
                  icon="add"
                  onPress={() => setReceipt(r)}
                />
                <Button
                  small
                  secondary
                  title="Details / end date"
                  onPress={() => setDetail(r.id)}
                />
              </View>
            </Card>
          </FadeIn>
        );
      })}
      <Copy color={colors.muted} size={12}>
        Record each maintenance payment here only once. It is included
        automatically in Revenue and the dashboard. To change a fee without
        rewriting history, end the old agreement and create a new one.
      </Copy>
      {creating && (
        <EntityForm
          entity="maintenanceContracts"
          defaults={{ currency, ...(client ? { clientId: client } : {}) }}
          onClose={() => setCreating(false)}
        />
      )}
      {detail && (
        <EntityDetail
          entity="maintenanceContracts"
          rowId={detail}
          onClose={() => setDetail(undefined)}
        />
      )}
      {receipt && (
        <EntityForm
          entity="maintenanceReceipts"
          defaults={{
            contractId: receipt.id,
            title: String(receipt.title),
            paidAmount: String(receipt.monthlyPrice || 0),
            currency: String(receipt.currency),
          }}
          onClose={() => setReceipt(undefined)}
        />
      )}
    </View>
  );
}
