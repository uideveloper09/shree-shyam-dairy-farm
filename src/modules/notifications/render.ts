/** Simple {{variable}} template renderer */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null> = {}
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const val = variables[key];
    return val === undefined || val === null ? "" : String(val);
  });
}

export function extractTemplateVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{\s*(\w+)\s*\}\}/g);
  return [...new Set([...matches].map((m) => m[1]))];
}
