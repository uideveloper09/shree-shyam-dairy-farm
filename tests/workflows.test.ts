import { describe, it, expect } from "vitest";
import { evaluateConditions } from "@/modules/workflows/conditions";
import {
  parseVisualToSteps,
  buildVisualFromSteps,
  validateVisualWorkflow,
} from "@/modules/workflows/visual";
import { WORKFLOW_TYPE_LABELS } from "@/modules/workflows/types";
import { hasPermission } from "@/lib/security/permissions";

describe("workflows/conditions", () => {
  it("evaluates amount gte", () => {
    expect(
      evaluateConditions([{ field: "amount", operator: "gte", value: 1000 }], { amount: 1500 })
    ).toBe(true);
  });

  it("evaluates eq on nested fields", () => {
    expect(
      evaluateConditions([{ field: "action", operator: "eq", value: "pause" }], { action: "pause" })
    ).toBe(true);
  });

  it("fails when condition not met", () => {
    expect(
      evaluateConditions([{ field: "amount", operator: "gt", value: 5000 }], { amount: 100 })
    ).toBe(false);
  });
});

describe("workflows/visual", () => {
  const steps = [
    { order: 0, name: "Manager", approverRole: "FARM_MANAGER" },
    { order: 1, name: "Owner", approverRole: "OWNER" },
  ];

  it("builds and parses visual workflow", () => {
    const visual = buildVisualFromSteps(steps);
    expect(validateVisualWorkflow(visual)).toEqual([]);
    const parsed = parseVisualToSteps(visual);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].approverRole).toBe("FARM_MANAGER");
  });
});

describe("workflows/types", () => {
  it("labels all workflow types", () => {
    expect(WORKFLOW_TYPE_LABELS.EXPENSE).toBe("Expense Approval");
    expect(WORKFLOW_TYPE_LABELS.REFUND).toBe("Refund Approval");
  });
});

describe("workflows/permissions", () => {
  it("grants accountant approve permission", () => {
    expect(hasPermission("ACCOUNTANT", "workflows:approve")).toBe(true);
  });

  it("grants admin workflow write", () => {
    expect(hasPermission("ADMIN", "admin:workflows:write")).toBe(true);
  });

  it("allows customer to submit requests", () => {
    expect(hasPermission("CUSTOMER", "workflows:write")).toBe(true);
    expect(hasPermission("CUSTOMER", "workflows:approve")).toBe(false);
  });
});
