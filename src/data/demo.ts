import {
  initialValues,
  sectionTitles,
  type EntityName,
} from "../domain/catalog";
import type { DataStore } from "../domain/repositories";
import { valuesToRow } from "../domain/validation";
export async function loadDemo(store: DataStore) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const save = (
    entity: EntityName,
    id: string,
    values: Record<string, string>,
  ) =>
    store
      .repository(entity)
      .save(valuesToRow(entity, { ...initialValues(entity), ...values }, id));
  await store.transaction(async () => {
    await save("clients", "demo-client-1", {
      name: "Olivia Martin",
      company: "Lumina Studio",
      email: "olivia@example.com",
      industry: "Design & architecture",
      country: "Netherlands",
    });
    await save("clients", "demo-client-2", {
      name: "James Wilson",
      company: "Orbit Finance",
      email: "james@example.com",
      industry: "Fintech",
      country: "United Kingdom",
    });
    await save("clients", "demo-client-3", {
      name: "Sofia Chen",
      company: "Bloom & Co.",
      email: "sofia@example.com",
      industry: "E-commerce",
      country: "Germany",
    });
    for (const [i, name] of [
      "React",
      "React Native",
      "Next.js",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
    ].entries())
      await save("technologies", `demo-tech-${i}`, {
        name,
        category: i < 4 ? "Frontend" : "Backend",
        experienceLevel: "EXPERT",
        yearsOfExperience: "4",
      });
    for (const [i, name] of [
      "Custom Development",
      "UI Implementation",
      "API Integration",
      "Testing",
      "Deployment",
      "Maintenance",
    ].entries())
      await save("services", `demo-service-${i}`, {
        name,
        defaultMinHours: "4",
        defaultMaxHours: "40",
      });
    await save("projects", "demo-project-1", {
      title: "Lumina — digital experience",
      clientId: "demo-client-1",
      status: "IN_PROGRESS",
      description:
        "A thoughtful, immersive portfolio for a new generation of architects.",
      estimatedHours: "80",
      actualHours: "48",
      finalPrice: "6400",
      estimatedPrice: "6400",
      startDate: date,
      endDate: new Date(now.getTime() + 21 * 86400000)
        .toISOString()
        .slice(0, 10),
    });
    await save("projects", "demo-project-2", {
      title: "Orbit analytics dashboard",
      clientId: "demo-client-2",
      status: "IN_PROGRESS",
      description:
        "Financial clarity, at a glance. A custom analytics workspace.",
      estimatedHours: "120",
      actualHours: "30",
      finalPrice: "9200",
      estimatedPrice: "9200",
    });
    await save("projects", "demo-project-3", {
      title: "Bloom online store",
      clientId: "demo-client-3",
      status: "COMPLETED",
      description: "An elegant storefront for everyday essentials.",
      estimatedHours: "60",
      actualHours: "56",
      finalPrice: "4800",
      estimatedPrice: "4800",
    });
    await save("projectTechnologies", "demo-link-1", {
      projectId: "demo-project-1",
      technologyId: "demo-tech-2",
    });
    await save("projectServices", "demo-link-2", {
      projectId: "demo-project-1",
      serviceId: "demo-service-1",
    });
    await save("estimates", "demo-estimate-1", {
      title: "Orbit mobile companion",
      clientId: "demo-client-2",
      status: "READY",
    });
    await save("estimateItems", "demo-item-1", {
      estimateId: "demo-estimate-1",
      title: "Dashboard & data visualization",
      technologyId: "demo-tech-1",
      serviceId: "demo-service-0",
      minHours: "20",
      maxHours: "50",
      selectedHours: "32",
      complexity: "COMPLEX",
    });
    await save("estimateItems", "demo-item-2", {
      estimateId: "demo-estimate-1",
      title: "Authentication & onboarding",
      minHours: "8",
      maxHours: "24",
      selectedHours: "16",
      implementationType: "THIRD_PARTY",
    });
    await save("proposals", "demo-proposal-1", {
      title: "Orbit mobile companion",
      number: "QF-2026-001",
      clientId: "demo-client-2",
      estimateId: "demo-estimate-1",
      status: "SENT",
      price: "7200",
    });
    await save("proposals", "demo-proposal-2", {
      title: "Lumina — digital experience",
      number: "QF-2026-002",
      clientId: "demo-client-1",
      status: "ACCEPTED",
      projectId: "demo-project-1",
      price: "6400",
    });
    for (const [i, title] of sectionTitles.entries())
      await save("proposalSections", `demo-section-${i}`, {
        proposalId: "demo-proposal-1",
        title,
        position: String(i),
        content:
          title === "Executive Summary"
            ? "A focused mobile experience that helps your customers understand their finances, wherever they are."
            : "",
      });
    await save("payments", "demo-payment-1", {
      title: "Lumina · project deposit",
      projectId: "demo-project-1",
      amount: "3200",
      paidAmount: "3200",
      date,
    });
    await save("payments", "demo-payment-2", {
      title: "Orbit · first milestone",
      projectId: "demo-project-2",
      amount: "4600",
      paidAmount: "2300",
      date,
    });
    await save("payments", "demo-payment-3", {
      title: "Bloom · final delivery",
      projectId: "demo-project-3",
      amount: "4800",
      paidAmount: "4800",
      date,
    });
    await save("expenses", "demo-expense-1", {
      title: "Design assets & hosting",
      projectId: "demo-project-1",
      amount: "240",
      date,
    });
    await save("maintenance", "demo-maintenance-1", {
      name: "Peace of mind",
      description: "A little ongoing care goes a long way.",
      monthlyPrice: "250",
      annualPrice: "2500",
      includedHours: "4",
      features:
        "Security updates\nPerformance monitoring\nMonthly backups\nPriority support",
    });
    await save("portfolio", "demo-portfolio-1", {
      title: "Bloom & Co.",
      projectId: "demo-project-3",
      clientId: "demo-client-3",
      description: "A fresh approach to thoughtful commerce.",
      visibility: "PRIVATE",
    });
  });
}
