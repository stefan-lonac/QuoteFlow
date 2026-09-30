import test from "node:test";
import assert from "node:assert/strict";
import {
  maintenanceMonths,
  maintenanceStatus,
  allReceipts,
} from "../src/domain/maintenance";
import { valuesToRow, formSchema } from "../src/domain/validation";
import { entityNames, initialValues } from "../src/domain/catalog";
import { revenue } from "../src/domain/calculations";
import type { Snapshot } from "../src/domain/repositories";
const agreement = (values: Record<string, string> = {}) =>
  valuesToRow(
    "maintenanceContracts",
    {
      ...initialValues("maintenanceContracts"),
      title: "Care",
      clientId: "c",
      monthlyPrice: "310",
      startDate: "2024-01-16",
      ...values,
    },
    "a",
  );
test("monthly accrual includes partial first and last months and leap February", () => {
  assert.deepEqual(
    maintenanceMonths(
      [agreement({ endDate: "2024-03-10" })],
      "EUR",
      "2024-04-01",
    ),
    [
      { month: "2024-03", accrued: 100 },
      { month: "2024-02", accrued: 310 },
      { month: "2024-01", accrued: 160 },
    ],
  );
});
test("ongoing accrual stops today, excludes future agreements and other currencies", () => {
  const r = agreement();
  assert.deepEqual(
    maintenanceMonths(
      [
        r,
        agreement({ currency: "USD" }),
        agreement({ startDate: "2025-01-01" }),
      ],
      "EUR",
      "2024-01-20",
    ),
    [{ month: "2024-01", accrued: 50 }],
  );
  assert.equal(maintenanceStatus(r, "2024-01-01"), "SCHEDULED");
  assert.equal(maintenanceStatus(r, "2024-01-16"), "ACTIVE");
  assert.equal(
    maintenanceStatus(agreement({ endDate: "2024-02-01" }), "2024-02-01"),
    "ACTIVE",
  );
  assert.equal(
    maintenanceStatus(agreement({ endDate: "2024-02-01" }), "2024-02-02"),
    "ENDED",
  );
});
test("receipt joins cash revenue once; an agreement alone is not received income", () => {
  const data = Object.fromEntries(
    entityNames.map((n) => [n, []]),
  ) as unknown as Snapshot;
  data.maintenanceContracts = [agreement()];
  assert.equal(revenue(allReceipts(data), []).received, 0);
  data.maintenanceReceipts = [
    valuesToRow(
      "maintenanceReceipts",
      {
        title: "Care",
        contractId: "a",
        paidAmount: "155",
        currency: "EUR",
        date: "2024-03-02",
      },
      "r",
    ),
  ];
  assert.equal(revenue(allReceipts(data), []).received, 155);
  assert.equal(revenue(allReceipts(data), []).outstanding, 0);
});
test("end date cannot precede start and blank end means ongoing", () => {
  const values: Record<string, string> = {
    ...initialValues("maintenanceContracts"),
    title: "Care",
    clientId: "c",
    startDate: "2024-02-01",
  };
  assert.equal(values.endDate, "");
  assert.ok(formSchema("maintenanceContracts").safeParse(values).success);
  assert.equal(
    formSchema("maintenanceContracts").safeParse({
      ...values,
      endDate: "2024-01-31",
    }).success,
    false,
  );
});
