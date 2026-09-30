import type { Row } from "./catalog";
import type { Snapshot } from "./repositories";
import { round } from "./calculations";
export const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function maintenanceStatus(row: Row, today = localDate()) {
  if (String(row.startDate) > today) return "SCHEDULED";
  if (row.endDate && String(row.endDate) < today) return "ENDED";
  return "ACTIVE";
}
// Inclusive service dates; partial calendar months are prorated by day.
export function maintenanceMonths(
  rows: Row[],
  currency: string,
  today = localDate(),
) {
  const months = new Map<string, number>();
  for (const row of rows.filter((r) => r.currency === currency)) {
    const start = String(row.startDate);
    const end =
      row.endDate && String(row.endDate) < today ? String(row.endDate) : today;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || start > end) continue;
    let year = Number(start.slice(0, 4)),
      month = Number(start.slice(5, 7));
    while (
      `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}` <=
      end.slice(0, 7)
    ) {
      const key = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
      const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const first = key === start.slice(0, 7) ? Number(start.slice(8, 10)) : 1;
      const last = key === end.slice(0, 7) ? Number(end.slice(8, 10)) : days;
      const amount = round(
        (Number(row.monthlyPrice || 0) * (last - first + 1)) / days,
      );
      months.set(key, round((months.get(key) || 0) + amount));
      if (++month > 12) {
        month = 1;
        year++;
      }
    }
  }
  return [...months]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, accrued]) => ({ month, accrued }));
}
export function allReceipts(data: Snapshot): Row[] {
  return [
    ...data.payments,
    ...data.maintenanceReceipts.map((r) => ({
      ...r,
      amount: r.paidAmount ?? 0,
      source: "maintenance",
    })),
  ];
}
