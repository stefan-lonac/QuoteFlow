import { z } from "zod";
import { fieldsFor, type EntityName, type Row } from "./catalog";
export function formSchema(entity: EntityName) {
  return z.record(z.string(), z.string()).superRefine((values, ctx) => {
    for (const f of fieldsFor(entity)) {
      const value = values[f.key]?.trim() || "";
      const issue = (message: string) =>
        ctx.addIssue({ code: "custom", path: [f.key], message });
      if (f.required && !value) issue("This field is required.");
      if (
        f.type === "number" &&
        value &&
        (!Number.isFinite(Number(value)) || Number(value) < 0)
      )
        issue("Enter a number of zero or more.");
      if (
        f.type === "date" &&
        value &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(Date.parse(value)) ||
          new Date(value).toISOString().slice(0, 10) !== value)
      )
        issue("Use a valid date: YYYY-MM-DD.");
      if (f.key === "email" && value && !z.email().safeParse(value).success)
        issue("Enter a valid email address.");
      if (f.key === "currency" && !/^[A-Z]{3}$/.test(value))
        issue("Use a three-letter currency, e.g. EUR.");
      if (f.options && value && !f.options.includes(value))
        issue("Select one of the available options.");
    }
    if (
      entity === "maintenanceContracts" &&
      values.endDate &&
      values.endDate < values.startDate!
    )
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date cannot be before the start date.",
      });
    if (entity === "estimateItems") {
      const min = Number(values.minHours);
      const max = Number(values.maxHours);
      const selected = Number(values.selectedHours);
      if (min > max || selected < min || selected > max)
        ctx.addIssue({
          code: "custom",
          path: ["selectedHours"],
          message: "Selected hours must be within the minimum and maximum.",
        });
    }
    if (
      entity === "payments" &&
      Number(values.paidAmount) > Number(values.amount)
    )
      ctx.addIssue({
        code: "custom",
        path: ["paidAmount"],
        message: "Received amount cannot exceed amount due.",
      });
  });
}
export function valuesToRow(
  entity: EntityName,
  values: Record<string, string>,
  id: string,
  original?: Row,
): Row {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: original?.createdAt ?? now,
    updatedAt: now,
    ...Object.fromEntries(
      fieldsFor(entity).map((f) => [
        f.key,
        values[f.key]?.trim()
          ? f.type === "number"
            ? Number(values[f.key])
            : values[f.key]!.trim()
          : null,
      ]),
    ),
  };
}
