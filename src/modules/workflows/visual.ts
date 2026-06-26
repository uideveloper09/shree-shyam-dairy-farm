import type { VisualWorkflow } from "@/modules/workflows/types";

export function parseVisualToSteps(visual: VisualWorkflow) {
  const approvalNodes = visual.nodes
    .filter((n) => n.type === "approval")
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  return approvalNodes.map((node, index) => ({
    order: index,
    name: node.label || `Step ${index + 1}`,
    approverRole: node.role,
    approverUserId: node.userId,
    autoApprove: false,
  }));
}

export function buildVisualFromSteps(
  steps: {
    order: number;
    name: string;
    approverRole?: string | null;
    approverUserId?: string | null;
  }[]
): VisualWorkflow {
  const nodes: VisualWorkflow["nodes"] = [
    { id: "trigger", type: "trigger", label: "Start", position: { x: 0, y: 100 } },
  ];
  const edges: VisualWorkflow["edges"] = [];

  let prevId = "trigger";
  steps.forEach((step, i) => {
    const id = `step_${step.order}`;
    nodes.push({
      id,
      type: "approval",
      label: step.name,
      role: step.approverRole ?? undefined,
      userId: step.approverUserId ?? undefined,
      position: { x: 200 + i * 180, y: 100 },
    });
    edges.push({ id: `e_${prevId}_${id}`, from: prevId, to: id, on: "approved" });
    prevId = id;
  });

  nodes.push({
    id: "end",
    type: "end",
    label: "Complete",
    position: { x: 200 + steps.length * 180, y: 100 },
  });
  edges.push({ id: `e_${prevId}_end`, from: prevId, to: "end", on: "approved" });

  return { nodes, edges };
}

export function validateVisualWorkflow(visual: VisualWorkflow): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(visual.nodes.map((n) => n.id));
  if (!visual.nodes.some((n) => n.type === "trigger")) errors.push("Missing trigger node");
  if (!visual.nodes.some((n) => n.type === "end")) errors.push("Missing end node");
  for (const edge of visual.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      errors.push(`Invalid edge: ${edge.from} → ${edge.to}`);
    }
  }
  return errors;
}
