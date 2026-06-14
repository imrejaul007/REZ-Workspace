/**
 * Interpolate template variables
 * Replaces {{variable}} placeholders with actual values
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Extract variable names from a template
 */
export function extractTemplateVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];

  return matches.map((match) => match.replace(/\{\{|\}\}/g, ''));
}

/**
 * Check if all required variables are provided
 */
export function validateTemplateVariables(
  template: string,
  provided: Record<string, string>
): { valid: boolean; missing: string[] } {
  const required = extractTemplateVariables(template);
  const missing: string[] = [];

  for (const variable of required) {
    if (provided[variable] === undefined) {
      missing.push(variable);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
