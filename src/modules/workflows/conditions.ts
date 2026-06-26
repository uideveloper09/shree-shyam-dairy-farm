import type { ConditionOperator } from "@/modules/workflows/types";

function getFieldValue(payload: Record<string, unknown>, field: string): unknown {
  const parts = field.split(".");
  let cur: unknown = payload;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function compare(op: string, actual: unknown, expected: unknown): boolean {
  const operator = op as ConditionOperator;
  switch (operator) {
    case "eq":
      return actual === expected;
    case "neq":
      return actual !== expected;
    case "gt":
      return Number(actual) > Number(expected);
    case "gte":
      return Number(actual) >= Number(expected);
    case "lt":
      return Number(actual) < Number(expected);
    case "lte":
      return Number(actual) <= Number(expected);
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "contains":
      return String(actual).toLowerCase().includes(String(expected).toLowerCase());
    default:
      return false;
  }
}

export function evaluateConditions(
  conditions: { field: string; operator: string; value: unknown; logicGroup?: string }[],
  payload: Record<string, unknown>
): boolean {
  if (!conditions.length) return true;

  const groups = new Map<string, boolean[]>();
  for (const c of conditions) {
    const group = c.logicGroup || "AND";
    const actual = getFieldValue(payload, c.field);
    const expected =
      typeof c.value === "object" && c.value !== null && "value" in (c.value as object)
        ? (c.value as { value: unknown }).value
        : c.value;
    const pass = compare(c.operator, actual, expected);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(pass);
  }

  const groupResults = [...groups.entries()].map(([, results]) => results.every(Boolean));
  return groupResults.some(Boolean);
}
