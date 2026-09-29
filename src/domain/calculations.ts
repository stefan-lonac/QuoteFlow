import type { Row } from "./catalog";
export const defaultMultipliers: Record<string, number> = {
  SIMPLE: 0.8,
  STANDARD: 1,
  COMPLEX: 1.4,
  VERY_COMPLEX: 1.8,
};
export const round = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
const number = (v: unknown) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n) || n < 0)
    throw new Error("Amounts and hours must be finite and non-negative.");
  return n;
};
export function calculateEstimate(
  estimate: Partial<Row>,
  items: Partial<Row>[],
  multipliers = defaultMultipliers,
) {
  let developmentHours = 0;
  let developmentPrice = 0;
  for (const item of items) {
    const multiplier = multipliers[String(item.complexity || "STANDARD")];
    if (
      multiplier === undefined ||
      !Number.isFinite(multiplier) ||
      multiplier <= 0
    )
      throw new Error("Invalid complexity multiplier.");
    const hours = number(item.selectedHours) * multiplier;
    developmentHours += hours;
    developmentPrice +=
      item.manualPrice != null && item.manualPrice !== ""
        ? number(item.manualPrice)
        : hours * number(item.hourlyRate ?? estimate.hourlyRate);
  }
  const testingHours =
    (developmentHours * number(estimate.testingPercent)) / 100;
  const managementHours =
    (developmentHours * number(estimate.managementPercent)) / 100;
  const deploymentHours = number(estimate.deploymentHours);
  const bufferHours =
    ((developmentHours + testingHours + managementHours + deploymentHours) *
      number(estimate.bufferPercent)) /
    100;
  const totalHours =
    developmentHours +
    testingHours +
    managementHours +
    deploymentHours +
    bufferHours;
  const internalPrice = round(
    developmentPrice +
      (testingHours + managementHours + deploymentHours + bufferHours) *
        number(estimate.hourlyRate),
  );
  const subtotal =
    estimate.manualPrice != null && estimate.manualPrice !== ""
      ? number(estimate.manualPrice)
      : internalPrice;
  const tax = round((subtotal * number(estimate.taxPercent)) / 100);
  return {
    developmentHours: round(developmentHours),
    testingHours: round(testingHours),
    managementHours: round(managementHours),
    deploymentHours,
    bufferHours: round(bufferHours),
    totalHours: round(totalHours),
    internalPrice,
    subtotal: round(subtotal),
    tax,
    finalPrice: round(subtotal + tax),
  };
}
export function revenue(payments: Partial<Row>[], expenses: Partial<Row>[]) {
  const received = round(
    payments.reduce((sum, p) => sum + number(p.paidAmount), 0),
  );
  const outstanding = round(
    payments.reduce(
      (sum, p) => sum + Math.max(0, number(p.amount) - number(p.paidAmount)),
      0,
    ),
  );
  const spent = round(expenses.reduce((sum, p) => sum + number(p.amount), 0));
  return {
    received,
    outstanding,
    expenses: spent,
    profit: round(received - spent),
  };
}
export function paymentStatus(
  p: Partial<Row>,
  today = new Date().toISOString().slice(0, 10),
) {
  if (number(p.paidAmount) >= number(p.amount)) return "PAID";
  if (p.dueDate && String(p.dueDate) < today) return "OVERDUE";
  return number(p.paidAmount) > 0 ? "PARTIALLY_PAID" : "PENDING";
}
export function money(amount: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
