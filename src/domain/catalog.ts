export type Field = {
  key: string;
  label: string;
  type?: "number" | "text" | "long" | "date" | "select" | "relation" | "image";
  options?: string[];
  entity?: EntityName;
  required?: boolean;
  default?: string | number;
};
export type Definition = {
  title: string;
  singular: string;
  icon: string;
  description: string;
  fields: Field[];
};
export type Row = {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: string | number | null;
};
const text = (key: string, label: string, required = false): Field => ({
  key,
  label,
  required,
});
const num = (key: string, label: string, value = 0): Field => ({
  key,
  label,
  type: "number",
  default: value,
});
const long = (key: string, label: string): Field => ({
  key,
  label,
  type: "long",
});
const select = (key: string, label: string, options: string[]): Field => ({
  key,
  label,
  type: "select",
  options,
  default: options[0],
});
const rel = (
  key: string,
  label: string,
  entity: EntityName,
  required = false,
): Field => ({ key, label, type: "relation", entity, required });
export const definitions = {
  clients: {
    title: "Clients",
    singular: "client",
    icon: "people-outline",
    description: "Good work starts with great relationships.",
    fields: [
      text("name", "Full name", true),
      text("company", "Company"),
      text("email", "Email"),
      text("phone", "Phone"),
      text("website", "Website"),
      text("country", "Country"),
      text("industry", "Industry"),
      long("notes", "Notes"),
    ],
  },
  projects: {
    title: "Projects",
    singular: "project",
    icon: "layers-outline",
    description: "From the first idea to the final handoff.",
    fields: [
      text("title", "Project title", true),
      rel("clientId", "Client", "clients"),
      select("status", "Status", [
        "LEAD",
        "PROPOSAL",
        "ACCEPTED",
        "IN_PROGRESS",
        "ON_HOLD",
        "COMPLETED",
        "CANCELLED",
      ]),
      long("description", "Description"),
      long("privateNotes", "Private notes"),
      { key: "startDate", label: "Start date", type: "date" },
      { key: "endDate", label: "End date", type: "date" },
      num("estimatedHours", "Estimated hours"),
      num("actualHours", "Actual hours"),
      num("estimatedPrice", "Estimated price"),
      num("finalPrice", "Final price"),
      text("currency", "Currency (ISO)", true),
      { key: "featuredImage", label: "Featured image", type: "image" },
    ],
  },
  estimates: {
    title: "Estimates",
    singular: "estimate",
    icon: "calculator-outline",
    description: "Price your expertise with confidence.",
    fields: [
      text("title", "Estimate title", true),
      rel("clientId", "Client", "clients"),
      rel("projectId", "Project", "projects"),
      select("status", "Status", ["DRAFT", "READY", "ARCHIVED"]),
      text("currency", "Currency (ISO)", true),
      num("hourlyRate", "Default hourly rate", 65),
      num("testingPercent", "Testing %", 15),
      num("managementPercent", "Project management %", 10),
      num("deploymentHours", "Deployment hours", 2),
      num("bufferPercent", "Buffer %", 10),
      num("taxPercent", "Tax %"),
      {
        key: "manualPrice",
        label: "Final price override (blank = calculated)",
        type: "number",
      },
      long("notes", "Private notes"),
    ],
  },
  estimateItems: {
    title: "Estimate items",
    singular: "line item",
    icon: "list-outline",
    description: "Build a clear scope, one deliverable at a time.",
    fields: [
      rel("estimateId", "Estimate", "estimates", true),
      text("title", "Deliverable", true),
      rel("technologyId", "Technology", "technologies"),
      rel("serviceId", "Service", "services"),
      select("implementationType", "Implementation", [
        "CUSTOM",
        "PLUGIN",
        "THIRD_PARTY",
        "EXISTING_SOLUTION",
        "HYBRID",
      ]),
      select("complexity", "Complexity", [
        "STANDARD",
        "SIMPLE",
        "COMPLEX",
        "VERY_COMPLEX",
      ]),
      num("minHours", "Minimum hours", 1),
      num("maxHours", "Maximum hours", 8),
      num("selectedHours", "Selected hours", 4),
      num("hourlyRate", "Hourly rate", 65),
      {
        key: "manualPrice",
        label: "Manual price (blank = calculated)",
        type: "number",
      },
      long("notes", "Notes"),
    ],
  },
  proposals: {
    title: "Proposals",
    singular: "proposal",
    icon: "document-text-outline",
    description: "Turn a good conversation into a signed yes.",
    fields: [
      text("title", "Project title", true),
      text("number", "Proposal number", true),
      rel("clientId", "Client", "clients", true),
      rel("estimateId", "Estimate", "estimates"),
      rel("maintenanceId", "Maintenance package", "maintenance"),
      select("status", "Status", [
        "DRAFT",
        "SENT",
        "ACCEPTED",
        "REJECTED",
        "EXPIRED",
      ]),
      { key: "date", label: "Proposal date", type: "date" },
      { key: "validUntil", label: "Valid until", type: "date" },
      num("price", "Client price"),
      text("currency", "Currency (ISO)", true),
      rel("projectId", "Converted project", "projects"),
    ],
  },
  proposalSections: {
    title: "Proposal sections",
    singular: "section",
    icon: "reader-outline",
    description: "Make every word your own.",
    fields: [
      rel("proposalId", "Proposal", "proposals", true),
      text("title", "Section title", true),
      long("content", "Content"),
      num("position", "Position"),
    ],
  },
  technologies: {
    title: "Technologies",
    singular: "technology",
    icon: "code-slash-outline",
    description: "The tools behind your best work.",
    fields: [
      text("name", "Name", true),
      text("category", "Category"),
      select("experienceLevel", "Experience", [
        "INTERMEDIATE",
        "EXPERT",
        "BEGINNER",
      ]),
      num("yearsOfExperience", "Years of experience"),
      {
        key: "hourlyRateOverride",
        label: "Hourly rate override",
        type: "number",
      },
      select("active", "Active", ["YES", "NO"]),
    ],
  },
  services: {
    title: "Services",
    singular: "service",
    icon: "grid-outline",
    description: "A reusable toolkit for your next estimate.",
    fields: [
      text("name", "Name", true),
      num("defaultMinHours", "Default minimum hours", 1),
      num("defaultMaxHours", "Default maximum hours", 8),
      { key: "defaultPrice", label: "Default fixed price", type: "number" },
      {
        key: "hourlyRateOverride",
        label: "Hourly rate override",
        type: "number",
      },
    ],
  },
  maintenance: {
    title: "Maintenance",
    singular: "package",
    icon: "construct-outline",
    description: "Keep things running. Keep clients happy.",
    fields: [
      text("name", "Package name", true),
      long("description", "Description"),
      select("frequency", "Frequency", [
        "MONTHLY",
        "QUARTERLY",
        "ANNUALLY",
        "CUSTOM",
        "NONE",
      ]),
      num("monthlyPrice", "Monthly price"),
      num("annualPrice", "Annual price"),
      num("includedHours", "Included hours"),
      long("features", "Features (one per line)"),
    ],
  },
  maintenanceContracts: {
    title: "Client maintenance",
    singular: "maintenance agreement",
    icon: "repeat-outline",
    description: "Monthly care, clear dates and recurring income.",
    fields: [
      text("title", "Agreement name", true),
      rel("clientId", "Client", "clients", true),
      num("monthlyPrice", "Monthly fee"),
      text("currency", "Currency (ISO)", true),
      { key: "startDate", label: "Starts on", type: "date", required: true },
      {
        key: "endDate",
        label: "Last service day (blank = ongoing)",
        type: "date",
        default: "",
      },
      num("includedHours", "Included hours per month"),
      long("notes", "Included services / notes"),
    ],
  },
  maintenanceReceipts: {
    title: "Maintenance receipts",
    singular: "maintenance receipt",
    icon: "wallet-outline",
    description: "Record money actually received for maintenance.",
    fields: [
      text("title", "Description", true),
      rel("contractId", "Agreement", "maintenanceContracts", true),
      num("paidAmount", "Amount received"),
      text("currency", "Currency (ISO)", true),
      { key: "date", label: "Received on", type: "date", required: true },
      long("notes", "Months covered / notes"),
    ],
  },
  payments: {
    title: "Payments",
    singular: "payment",
    icon: "wallet-outline",
    description: "Know what is paid and what is on its way.",
    fields: [
      text("title", "Description", true),
      rel("projectId", "Project", "projects", true),
      num("amount", "Amount due"),
      num("paidAmount", "Amount received"),
      text("currency", "Currency (ISO)", true),
      { key: "date", label: "Payment date", type: "date" },
      { key: "dueDate", label: "Due date", type: "date" },
    ],
  },
  expenses: {
    title: "Expenses",
    singular: "expense",
    icon: "receipt-outline",
    description: "The other side of the bottom line.",
    fields: [
      text("title", "Description", true),
      rel("projectId", "Project", "projects", true),
      num("amount", "Amount"),
      text("currency", "Currency (ISO)", true),
      { key: "date", label: "Date", type: "date" },
      long("notes", "Notes"),
    ],
  },
  portfolio: {
    title: "Portfolio",
    singular: "portfolio entry",
    icon: "briefcase-outline",
    description: "A collection of work worth sharing.",
    fields: [
      text("title", "Title", true),
      rel("projectId", "Project", "projects"),
      rel("clientId", "Client", "clients"),
      long("description", "Description"),
      { key: "featuredImage", label: "Featured image", type: "image" },
      select("visibility", "Visibility", ["PRIVATE", "PUBLIC"]),
      select("showRevenue", "Show revenue", ["NO", "YES"]),
    ],
  },
  profile: {
    title: "Your profile",
    singular: "profile",
    icon: "person-outline",
    description: "Your expertise, beautifully presented.",
    fields: [
      text("firstName", "First name", true),
      text("lastName", "Last name"),
      text("professionalTitle", "Professional title"),
      long("summary", "Professional summary"),
      text("email", "Email"),
      text("phone", "Phone"),
      text("company", "Company"),
      text("website", "Website"),
      { key: "profileImage", label: "Profile image", type: "image" },
      { key: "companyLogo", label: "Company logo", type: "image" },
      num("hourlyRate", "Hourly rate", 65),
      text("currency", "Currency (ISO)", true),
      num("taxPercent", "Tax %"),
      num("bufferPercent", "Default buffer %", 10),
      num("testingPercent", "Testing %", 15),
      num("managementPercent", "Project management %", 10),
      long("paymentTerms", "Default payment terms"),
    ],
  },
  projectTechnologies: {
    title: "Project stack",
    singular: "technology link",
    icon: "code-outline",
    description: "",
    fields: [
      rel("projectId", "Project", "projects", true),
      rel("technologyId", "Technology", "technologies", true),
    ],
  },
  projectServices: {
    title: "Project services",
    singular: "service link",
    icon: "grid-outline",
    description: "",
    fields: [
      rel("projectId", "Project", "projects", true),
      rel("serviceId", "Service", "services", true),
    ],
  },
  files: {
    title: "Files",
    singular: "file",
    icon: "attach-outline",
    description: "",
    fields: [
      text("name", "Name", true),
      text("uri", "URI", true),
      text("mimeType", "MIME type"),
    ],
  },
  settings: {
    title: "Settings",
    singular: "setting",
    icon: "settings-outline",
    description: "",
    fields: [text("name", "Key", true), text("value", "Value")],
  },
} satisfies Record<string, Definition>;
export type EntityName =
  | "clients"
  | "projects"
  | "estimates"
  | "estimateItems"
  | "proposals"
  | "proposalSections"
  | "technologies"
  | "services"
  | "maintenance"
  | "maintenanceContracts"
  | "maintenanceReceipts"
  | "payments"
  | "expenses"
  | "portfolio"
  | "profile"
  | "projectTechnologies"
  | "projectServices"
  | "files"
  | "settings";
export const entityNames = Object.keys(definitions) as EntityName[];
export const fieldsFor = (entity: EntityName): Field[] =>
  definitions[entity].fields;
export const label = (row: Row) =>
  String(row.title || row.name || row.firstName || row.id);
export const sectionTitles = [
  "Executive Summary",
  "Objectives",
  "Proposed Solution",
  "Scope",
  "Deliverables",
  "Technology Stack",
  "Timeline",
  "Investment",
  "Maintenance",
  "Exclusions",
  "Terms",
  "About",
  "Relevant Projects",
  "Next Steps",
];
export const initialValues = (entity: EntityName): Record<string, string> =>
  Object.fromEntries(
    fieldsFor(entity).map((f) => [
      f.key,
      String(
        f.default ??
          (f.key === "currency"
            ? "EUR"
            : f.type === "date"
              ? new Date().toISOString().slice(0, 10)
              : ""),
      ),
    ]),
  );
