import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateEstimate,
  defaultMultipliers,
  paymentStatus,
  revenue,
} from "../src/domain/calculations";
const estimate = {
  hourlyRate: 100,
  testingPercent: 15,
  managementPercent: 10,
  deploymentHours: 2,
  bufferPercent: 10,
  taxPercent: 20,
};
test("deterministic development, overhead, buffer and tax", () => {
  const result = calculateEstimate(estimate, [
    { selectedHours: 10, hourlyRate: 100, complexity: "STANDARD" },
  ]);
  assert.deepEqual(result, {
    developmentHours: 10,
    testingHours: 1.5,
    managementHours: 1,
    deploymentHours: 2,
    bufferHours: 1.45,
    totalHours: 15.95,
    internalPrice: 1595,
    subtotal: 1595,
    tax: 319,
    finalPrice: 1914,
  });
});
test("all default complexity multipliers and configured values", () => {
  for (const [complexity, multiplier] of Object.entries(defaultMultipliers))
    assert.equal(
      calculateEstimate({ hourlyRate: 100 }, [
        { selectedHours: 10, hourlyRate: 100, complexity },
      ]).developmentHours,
      10 * multiplier,
    );
  assert.equal(
    calculateEstimate(
      {},
      [{ selectedHours: 10, complexity: "COMPLEX", hourlyRate: 50 }],
      { COMPLEX: 2 },
    ).internalPrice,
    1000,
  );
});
test("zero and positive item overrides are preserved even with changed complexity", () => {
  const items = [
    {
      selectedHours: 10,
      hourlyRate: 100,
      complexity: "VERY_COMPLEX",
      manualPrice: 0,
    },
    {
      selectedHours: 5,
      hourlyRate: 100,
      complexity: "STANDARD",
      manualPrice: 275,
    },
  ];
  const before = structuredClone(items);
  assert.equal(calculateEstimate({}, items).internalPrice, 275);
  assert.deepEqual(items, before);
});
test("estimate manual price wins, with explicit tax added", () => {
  const items = [
    { selectedHours: 100, hourlyRate: 100, complexity: "COMPLEX" },
  ];
  assert.equal(
    calculateEstimate({ ...estimate, manualPrice: 500 }, items).finalPrice,
    600,
  );
  assert.equal(
    calculateEstimate({ ...estimate, manualPrice: 0 }, items).finalPrice,
    0,
  );
});
test("invalid inputs are rejected and unknown complexity does not silently fall back", () => {
  assert.throws(() => calculateEstimate({}, [{ selectedHours: -1 }]));
  assert.throws(() => calculateEstimate({}, [{ selectedHours: Infinity }]));
  assert.throws(() => calculateEstimate({}, [{ complexity: "UNKNOWN" }]));
  assert.throws(() =>
    calculateEstimate({}, [{ complexity: "STANDARD" }], { STANDARD: -1 }),
  );
});
test("revenue, expenses, profit and outstanding use actual receipts", () => {
  assert.deepEqual(
    revenue(
      [
        { amount: 1000, paidAmount: 250 },
        { amount: 500, paidAmount: 500 },
      ],
      [{ amount: 200 }, { amount: 50 }],
    ),
    { received: 750, outstanding: 750, expenses: 250, profit: 500 },
  );
  assert.deepEqual(revenue([], [{ amount: 100 }]), {
    received: 0,
    outstanding: 0,
    expenses: 100,
    profit: -100,
  });
});
test("payment statuses include overdue partial payments", () => {
  assert.equal(
    paymentStatus({ amount: 100, paidAmount: 100, dueDate: "2020-01-01" }),
    "PAID",
  );
  assert.equal(
    paymentStatus({ amount: 100, paidAmount: 25, dueDate: "2020-01-01" }),
    "OVERDUE",
  );
  assert.equal(
    paymentStatus({ amount: 100, paidAmount: 25, dueDate: "2099-01-01" }),
    "PARTIALLY_PAID",
  );
  assert.equal(
    paymentStatus({ amount: 100, paidAmount: 0, dueDate: "2099-01-01" }),
    "PENDING",
  );
});
