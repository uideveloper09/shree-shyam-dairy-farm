import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import {
  createWorkflowDefinition,
  listWorkflowDefinitions,
  getWorkflowDashboardStats,
} from "@/services/workflows/service";
import { getRecentAuditLogs } from "@/modules/workflows/audit";
import type { WorkflowType } from "@prisma/client";
import { parseVisualToSteps } from "@/modules/workflows/visual";
import { validateVisualWorkflow } from "@/modules/workflows/visual";
import type { VisualWorkflow } from "@/modules/workflows/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requirePermission("admin:workflows:read");
  if (auth.error) return auth.error;

  const view = new URL(request.url).searchParams.get("view");

  if (view === "dashboard") {
    const [stats, audit] = await Promise.all([getWorkflowDashboardStats(), getRecentAuditLogs(30)]);
    return NextResponse.json({ stats, audit });
  }

  const definitions = await listWorkflowDefinitions();
  return NextResponse.json({ definitions });
}

export async function POST(request: Request) {
  const auth = await requirePermission("admin:workflows:write");
  if (auth.error) return auth.error;

  const body = await request.json();

  let steps = body.steps;
  if (body.visual) {
    const errors = validateVisualWorkflow(body.visual as VisualWorkflow);
    if (errors.length) {
      return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
    }
    steps = parseVisualToSteps(body.visual as VisualWorkflow);
  }

  const definition = await createWorkflowDefinition({
    slug: body.slug,
    name: body.name,
    type: body.type as WorkflowType,
    description: body.description,
    createdById: auth.user!.id,
    steps,
    conditions: body.conditions,
    triggers: body.triggers,
    visual: body.visual,
  });

  return NextResponse.json({ definition }, { status: 201 });
}
