import type {
  CrmCampaignStatus,
  CrmFollowUpType,
  CrmLeadStatus,
  CrmOpportunityStage,
  CrmQuotationStatus,
  CrmTicketPriority,
  CrmTicketStatus,
} from "@prisma/client";

export const DEFAULT_PIPELINE_STAGES = [
  { name: "Prospecting", order: 0, probability: 10 },
  { name: "Qualification", order: 1, probability: 25 },
  { name: "Proposal", order: 2, probability: 50 },
  { name: "Negotiation", order: 3, probability: 75 },
  { name: "Closed Won", order: 4, probability: 100 },
  { name: "Closed Lost", order: 5, probability: 0 },
] as const;

export const OPPORTUNITY_STAGE_LABELS: Record<CrmOpportunityStage, string> = {
  PROSPECTING: "Prospecting",
  QUALIFICATION: "Qualification",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

export const LEAD_STATUS_LABELS: Record<CrmLeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export const TICKET_STATUS_LABELS: Record<CrmTicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_CUSTOMER: "Waiting on Customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const TICKET_PRIORITY_LABELS: Record<CrmTicketPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const QUOTATION_STATUS_LABELS: Record<CrmQuotationStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export const CAMPAIGN_STATUS_LABELS: Record<CrmCampaignStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

export const FOLLOW_UP_TYPE_LABELS: Record<CrmFollowUpType, string> = {
  CALL: "Call",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  MEETING: "Meeting",
  VISIT: "Visit",
  OTHER: "Other",
};

export type QuotationLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};
