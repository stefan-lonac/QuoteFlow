import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import type { Row } from "../domain/catalog";
import type { Snapshot } from "../domain/repositories";
import {
  calculateEstimate,
  defaultMultipliers,
  money,
} from "../domain/calculations";
export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function multipliersFrom(data: Snapshot) {
  const row = data.settings.find((s) => s.name === "multipliers");
  return row
    ? (JSON.parse(String(row.value)) as Record<string, number>)
    : defaultMultipliers;
}
export async function exportPDF(
  type: "internal" | "client",
  row: Row,
  data: Snapshot,
  includeInternal = false,
) {
  const profile = data.profile[0];
  const client = data.clients.find((c) => c.id === row.clientId);
  const estimate =
    type === "internal"
      ? row
      : data.estimates.find((e) => e.id === row.estimateId);
  const items = data.estimateItems.filter((i) => i.estimateId === estimate?.id);
  const totals = estimate
    ? calculateEstimate(estimate, items, multipliersFrom(data))
    : null;
  let logo = "";
  if (profile?.companyLogo) {
    const uri = String(profile.companyLogo);
    const ref = data.files.find((f) => f.uri === uri);
    if (uri.startsWith("data:image/")) logo = uri;
    else if (Platform.OS !== "web" && ref)
      logo =
        "data:" +
        ref.mimeType +
        ";base64," +
        (await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        }));
  }
  const sections =
    type === "client"
      ? data.proposalSections
          .filter((s) => s.proposalId === row.id)
          .sort((a, b) => Number(a.position) - Number(b.position))
          .map(
            (s) =>
              "<section><h2>" +
              escapeHtml(s.title) +
              "</h2><p>" +
              escapeHtml(s.content || "—") +
              "</p></section>",
          )
          .join("")
      : "";
  const internal =
    (type === "internal" || includeInternal) && totals
      ? "<h2>Internal estimate · confidential</h2><table><tr><th>Deliverable</th><th>Complexity</th><th>Base hours</th><th>Rate</th><th>Override</th></tr>" +
        items
          .map(
            (i) =>
              "<tr><td>" +
              escapeHtml(i.title) +
              "</td><td>" +
              escapeHtml(i.complexity) +
              "</td><td>" +
              escapeHtml(i.selectedHours) +
              "</td><td>" +
              escapeHtml(
                money(Number(i.hourlyRate), String(estimate?.currency)),
              ) +
              "</td><td>" +
              (i.manualPrice == null
                ? "—"
                : escapeHtml(
                    money(Number(i.manualPrice), String(estimate?.currency)),
                  )) +
              "</td></tr>",
          )
          .join("") +
        "</table><p>Development: " +
        totals.developmentHours +
        " h · Testing: " +
        totals.testingHours +
        " h · Management: " +
        totals.managementHours +
        " h · Deployment: " +
        totals.deploymentHours +
        " h · Buffer: " +
        totals.bufferHours +
        " h</p><p>Total hours: " +
        totals.totalHours +
        " · Internal price: " +
        escapeHtml(money(totals.internalPrice, String(estimate?.currency))) +
        " · Tax: " +
        escapeHtml(money(totals.tax, String(estimate?.currency))) +
        "</p>"
      : "";
  const maintenance = data.maintenance.find((m) => m.id === row.maintenanceId);
  const html =
    '<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{margin:38px}body{font-family:Arial,sans-serif;color:#242033;font-size:12px;line-height:1.65}header{border-bottom:3px solid #b297dc;padding-bottom:24px;margin-bottom:30px}h1{font-size:34px;line-height:1.2;letter-spacing:-1px}h2{font-size:16px;color:#655081;margin-top:28px}p{white-space:pre-wrap}section{break-inside:avoid}.eyebrow{letter-spacing:3px;color:#80718c;font-size:10px}.price{background:#f3eef9;border-radius:12px;padding:24px;font-size:26px}table{border-collapse:collapse;width:100%;font-size:10px}td,th{text-align:left;padding:9px;border-bottom:1px solid #eee}footer{margin-top:40px;font-size:10px;color:#8d8795}</style></head><body><header>' +
    (logo
      ? '<img style="max-height:60px;max-width:170px" src="' +
        escapeHtml(logo) +
        '">'
      : "") +
    '<p class="eyebrow">' +
    (type === "internal" ? "INTERNAL ESTIMATE" : "PROJECT PROPOSAL") +
    "</p><h1>" +
    escapeHtml(row.title) +
    "</h1><p>" +
    escapeHtml(row.number || row.id.slice(0, 8)) +
    " · " +
    escapeHtml(row.date || new Date().toISOString().slice(0, 10)) +
    "</p></header><p><strong>Prepared for</strong><br>" +
    escapeHtml(client?.name) +
    "<br>" +
    escapeHtml(client?.company) +
    "<br>" +
    escapeHtml(client?.email) +
    "</p><p><strong>Prepared by</strong><br>" +
    escapeHtml(profile?.firstName) +
    " " +
    escapeHtml(profile?.lastName) +
    " · " +
    escapeHtml(profile?.professionalTitle) +
    "<br>" +
    escapeHtml(profile?.company) +
    "<br>" +
    escapeHtml(profile?.email) +
    " · " +
    escapeHtml(profile?.phone) +
    "<br>" +
    escapeHtml(profile?.website) +
    "</p>" +
    sections +
    '<h2>Investment</h2><div class="price">' +
    escapeHtml(
      money(
        type === "internal" ? totals?.finalPrice || 0 : Number(row.price),
        String(row.currency || "EUR"),
      ),
    ) +
    "</div>" +
    (maintenance
      ? "<h2>" +
        escapeHtml(maintenance.name) +
        "</h2><p>" +
        escapeHtml(maintenance.description) +
        "</p><p>" +
        escapeHtml(maintenance.features) +
        "</p><p>Monthly: " +
        escapeHtml(
          money(Number(maintenance.monthlyPrice), String(row.currency)),
        ) +
        " · Annual: " +
        escapeHtml(
          money(Number(maintenance.annualPrice), String(row.currency)),
        ) +
        "</p>"
      : "") +
    internal +
    "<footer>" +
    (type === "internal"
      ? "Private working document. Not intended for clients."
      : "Prepared with care · " +
        escapeHtml(profile?.company || profile?.firstName || "QuoteFlow")) +
    "</footer></body></html>";
  if (Platform.OS === "web") {
    const popup = window.open("", "_blank");
    if (!popup) throw new Error("Allow pop-ups to preview and save your PDF.");
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 400);
    return;
  }
  const file = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/pdf",
    dialogTitle:
      type === "internal"
        ? "Internal estimate — confidential"
        : "Client proposal",
  });
}
