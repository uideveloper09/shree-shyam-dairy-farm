import type { WorkflowType, WorkflowInstanceStatus } from "@prisma/client";

export type WorkflowPayload = Record<string, unknown>;

export type SubmitRequestInput = {
  type: WorkflowType;
  requesterId: string;
  tenantId?: string | null;
  title: string;
  payload: WorkflowPayload;
  resourceType: string;
  resourceId: string;
  workflowSlug?: string;
};

export type ApproveStepInput = {
  instanceId: string;
  stepId: string;
  actorId: string;
  actorRole: string;
  approved: boolean;
  comment?: string;
};

export type VisualWorkflow = {
  nodes: {
    id: string;
    type: "trigger" | "approval" | "condition" | "end";
    label?: string;
    role?: string;
    userId?: string;
    position?: { x: number; y: number };
  }[];
  edges: {
    id: string;
    from: string;
    to: string;
    on?: "approved" | "rejected" | "default";
    label?: string;
  }[];
};

export type ConditionOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";

export const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
  EXPENSE: "Expense Approval",
  PURCHASE: "Purchase Approval",
  LEAVE: "Leave Approval",
  REFUND: "Refund Approval",
  SUBSCRIPTION: "Subscription Approval",
  CUSTOM: "Custom Workflow",
};

export const TERMINAL_STATUSES: WorkflowInstanceStatus[] = ["APPROVED", "REJECTED", "CANCELLED"];
