import type { AiModule } from "@prisma/client";

export const MODULE_LABELS: Record<AiModule, string> = {
  CEO: "CEO Dashboard AI",
  FINANCE: "Finance AI",
  FARM: "Farm AI",
  INVENTORY: "Inventory AI",
  MARKETING: "Marketing AI",
  SALES: "Sales AI",
  CUSTOMER: "Customer AI",
  VOICE: "Voice Assistant",
  WHATSAPP: "WhatsApp AI",
  AGENT: "Autonomous AI Agents",
};

export const DOMAIN_MODULES: AiModule[] = [
  "CEO",
  "FINANCE",
  "FARM",
  "INVENTORY",
  "MARKETING",
  "SALES",
  "CUSTOMER",
];

export type ModuleInsight = {
  title: string;
  summary: string;
  score?: number;
  metrics?: Record<string, number | string>;
  recommendations?: string[];
};
