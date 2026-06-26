import { describe, it, expect } from "vitest";
import {
  DEFAULT_PIPELINE_STAGES,
  LEAD_STATUS_LABELS,
  OPPORTUNITY_STAGE_LABELS,
  TICKET_STATUS_LABELS,
  QUOTATION_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  FOLLOW_UP_TYPE_LABELS,
} from "@/modules/crm/types";
import { hasPermission } from "@/lib/security/permissions";

describe("crm/types", () => {
  it("defines default pipeline stages", () => {
    expect(DEFAULT_PIPELINE_STAGES.length).toBe(6);
    expect(DEFAULT_PIPELINE_STAGES[0].name).toBe("Prospecting");
  });

  it("labels all lead statuses", () => {
    expect(Object.keys(LEAD_STATUS_LABELS).length).toBe(5);
  });

  it("labels opportunity stages", () => {
    expect(OPPORTUNITY_STAGE_LABELS.CLOSED_WON).toBe("Closed Won");
  });

  it("labels ticket, quotation, campaign, follow-up enums", () => {
    expect(Object.keys(TICKET_STATUS_LABELS).length).toBe(5);
    expect(Object.keys(QUOTATION_STATUS_LABELS).length).toBe(5);
    expect(Object.keys(CAMPAIGN_STATUS_LABELS).length).toBe(4);
    expect(Object.keys(FOLLOW_UP_TYPE_LABELS).length).toBe(6);
  });
});

describe("crm/permissions", () => {
  it("grants admin CRM access", () => {
    expect(hasPermission("ADMIN", "admin:crm:write")).toBe(true);
    expect(hasPermission("FARM_MANAGER", "crm:write")).toBe(true);
  });

  it("grants customer support ticket access", () => {
    expect(hasPermission("CUSTOMER", "crm:support")).toBe(true);
    expect(hasPermission("CUSTOMER", "admin:crm:read")).toBe(false);
  });

  it("grants accountant CRM read", () => {
    expect(hasPermission("ACCOUNTANT", "crm:read")).toBe(true);
    expect(hasPermission("ACCOUNTANT", "admin:crm:write")).toBe(false);
  });
});
