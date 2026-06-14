import {
  ContentTemplate,
  PersonalizationRule,
  PersonalizationContext,
  GeneratedContent,
  IContentTemplate,
  IPersonalizationRule,
  IPersonalizationContext
} from '../models/Personalization';

export interface PersonalizationInput {
  templateId: string;
  contactId: string;
  dealId?: string;
  contactData?: Partial<IPersonalizationContext['contact']>;
  companyData?: Partial<IPersonalizationContext['company']>;
  dealData?: Partial<IPersonalizationContext['deal']>;
  customVariables?: Record<string, string>;
}

export interface PersonalizationOutput {
  subject?: string;
  title?: string;
  body: string;
  cta?: { text: string; url: string };
  variablesUsed: { name: string; value: string; source: string }[];
  rulesApplied: string[];
  variantName?: string;
}

export class PersonalizationService {
  /**
   * Generate personalized content from a template
   */
  static async generateContent(input: PersonalizationInput): Promise<PersonalizationOutput> {
    const { templateId, contactId, dealId, contactData, companyData, dealData, customVariables } = input;

    // Get template
    const template = await ContentTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Build context
    const context = await this.buildContext(contactId, contactData, companyData, dealData);

    // Select variant if A/B testing
    let variantName: string | undefined;
    let content = this.getTemplateContent(template, context);

    if (template.variants && template.variants.length > 0) {
      const selected = this.selectVariant(template.variants);
      variantName = selected.name;
      content = {
        ...content,
        subject: selected.subject || content.subject,
        body: selected.body
      };
    }

    // Apply variable substitution
    const { body: personalizedBody, variablesUsed: bodyVariables } = this.substituteVariables(
      content.body,
      context,
      customVariables,
      template.variables
    );

    const personalizedSubject = content.subject
      ? this.substituteVariables(content.subject, context, customVariables, template.variables).body
      : undefined;

    const personalizedTitle = content.title
      ? this.substituteVariables(content.title, context, customVariables, template.variables).body
      : undefined;

    // Apply personalization rules
    const { body: ruleAppliedBody, rulesApplied } = await this.applyRules(
      personalizedBody,
      context,
      template._id.toString()
    );

    // Increment template usage
    template.usageCount += 1;
    await template.save();

    return {
      subject: personalizedSubject,
      title: personalizedTitle,
      body: ruleAppliedBody,
      cta: content.cta,
      variablesUsed: bodyVariables,
      rulesApplied,
      variantName
    };
  }

  /**
   * Save generated content
   */
  static async saveGeneratedContent(
    tenantId: string,
    input: PersonalizationInput,
    output: PersonalizationOutput
  ): Promise<void> {
    const generated = new GeneratedContent({
      tenantId,
      templateId: input.templateId,
      contactId: input.contactId,
      dealId: input.dealId,
      contentType: (await ContentTemplate.findById(input.templateId))?.contentType || 'email',
      subject: output.subject,
      title: output.title,
      body: output.body,
      cta: output.cta,
      variablesUsed: output.variablesUsed,
      rulesApplied: output.rulesApplied,
      variantName: output.variantName,
      createdBy: 'system'
    });

    await generated.save();
  }

  /**
   * Build personalization context from contact/company/deal data
   */
  private static async buildContext(
    contactId: string,
    contactData?: Partial<IPersonalizationContext['contact']>,
    companyData?: Partial<IPersonalizationContext['company']>,
    dealData?: Partial<IPersonalizationContext['deal']>
  ): Promise<IPersonalizationContext['contact'] & IPersonalizationContext['company'] & IPersonalizationContext['deal'] & Record<string, unknown>> {
    // Merge provided data with any stored context
    const mergedContact = contactData || {};
    const mergedCompany = companyData || {};
    const mergedDeal = dealData || {};

    // Compute additional fields
    const computedFields: Record<string, string | number | boolean> = {};

    // Time-based variables
    const now = new Date();
    computedFields.currentDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    computedFields.currentYear = now.getFullYear();
    computedFields.currentMonth = now.toLocaleDateString('en-US', { month: 'long' });

    // Company age
    if (mergedCompany.founded) {
      computedFields.companyAge = now.getFullYear() - mergedCompany.founded;
    }

    // Deal value formatting
    if (mergedDeal.value) {
      computedFields.dealValueFormatted = `$${mergedDeal.value.toLocaleString()}`;
      computedFields.dealValueShort = `$${(mergedDeal.value / 1000).toFixed(0)}K`;
    }

    return {
      ...mergedContact,
      ...mergedCompany,
      ...mergedDeal,
      ...computedFields
    };
  }

  /**
   * Get template content (handles nested variables)
   */
  private static getTemplateContent(
    template: IContentTemplate,
    context: Record<string, unknown>
  ): { subject?: string; title?: string; body: string; cta?: { text: string; url: string } } {
    return {
      subject: template.subject,
      title: template.title,
      body: template.body,
      cta: template.cta
    };
  }

  /**
   * Select variant for A/B testing based on weights
   */
  private static selectVariant(
    variants: IContentTemplate['variants']
  ): NonNullable<IContentTemplate['variants']>[0] {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }

    return variants[0];
  }

  /**
   * Substitute variables in content
   */
  private static substituteVariables(
    content: string,
    context: Record<string, unknown>,
    customVariables?: Record<string, string>,
    templateVariables?: IContentTemplate['variables']
  ): { body: string; variablesUsed: { name: string; value: string; source: string }[] } {
    let result = content;
    const variablesUsed: { name: string; value: string; source: string }[] = [];

    // Variable pattern: {{variable_name}} or {{variable_name:default_value}}
    const variablePattern = /\{\{([^}:]+)(?::([^}]*))?\}\}/g;

    result = result.replace(variablePattern, (match, varName, defaultValue) => {
      const trimmedName = varName.trim();

      // Check custom variables first
      if (customVariables && trimmedName in customVariables) {
        variablesUsed.push({ name: trimmedName, value: customVariables[trimmedName], source: 'custom' });
        return customVariables[trimmedName];
      }

      // Check context
      if (trimmedName in context) {
        const value = context[trimmedName];
        const valueStr = value !== null && value !== undefined ? String(value) : '';
        variablesUsed.push({ name: trimmedName, value: valueStr, source: 'context' });
        return valueStr;
      }

      // Check template variables for defaults
      const templateVar = templateVariables?.find(v => v.name === trimmedName);
      if (templateVar?.defaultValue) {
        variablesUsed.push({ name: trimmedName, value: templateVar.defaultValue, source: 'template_default' });
        return templateVar.defaultValue;
      }

      // Return default value if provided
      if (defaultValue !== undefined) {
        variablesUsed.push({ name: trimmedName, value: defaultValue, source: 'default' });
        return defaultValue;
      }

      // Return placeholder if nothing found
      return match;
    });

    return { body: result, variablesUsed };
  }

  /**
   * Apply personalization rules to content
   */
  private static async applyRules(
    content: string,
    context: Record<string, unknown>,
    templateId: string
  ): Promise<{ body: string; rulesApplied: string[] }> {
    let result = content;
    const rulesApplied: string[] = [];

    // Get active rules for this template or all rules
    const query: Record<string, unknown> = { isActive: true };
    const rules = await PersonalizationRule.find(query).sort({ priority: -1 });

    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, context)) {
        result = this.applyActions(rule.actions, result, context);
        rulesApplied.push(rule._id.toString());
      }
    }

    return { body: result, rulesApplied };
  }

  /**
   * Evaluate if conditions match the context
   */
  private static evaluateConditions(
    conditions: IPersonalizationRule['conditions'],
    context: Record<string, unknown>
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const value = this.getNestedValue(context, condition.field);
      const targetValue = condition.value;

      switch (condition.operator) {
        case 'equals':
          return value === targetValue;
        case 'not_equals':
          return value !== targetValue;
        case 'contains':
          return String(value).toLowerCase().includes(String(targetValue).toLowerCase());
        case 'not_contains':
          return !String(value).toLowerCase().includes(String(targetValue).toLowerCase());
        case 'greater_than':
          return Number(value) > Number(targetValue);
        case 'less_than':
          return Number(value) < Number(targetValue);
        case 'in':
          return Array.isArray(targetValue) && targetValue.includes(value as string);
        case 'not_in':
          return Array.isArray(targetValue) && !targetValue.includes(value as string);
        case 'exists':
          return value !== null && value !== undefined;
        case 'not_exists':
          return value === null || value === undefined;
        default:
          return false;
      }
    });
  }

  /**
   * Apply rule actions to content
   */
  private static applyActions(
    actions: IPersonalizationRule['actions'],
    content: string,
    context: Record<string, unknown>
  ): string {
    let result = content;

    for (const action of actions) {
      switch (action.type) {
        case 'replace_text':
          result = result.replace(
            new RegExp(this.escapeRegex(action.target || ''), 'gi'),
            action.value
          );
          break;

        case 'insert_variable':
          if (action.target) {
            const value = this.getNestedValue(context, action.value) || '';
            result = result.replace(
              new RegExp(`\\{\\{${action.target}\\}\\}`, 'g'),
              String(value)
            );
          }
          break;

        case 'add_section':
          // Insert section before closing tag or at end
          if (result.includes('{{/section}}')) {
            result = result.replace('{{/section}}', `${action.value}\n{{/section}}`);
          } else {
            result += `\n\n${action.value}`;
          }
          break;

        case 'remove_section':
          // Remove content between section tags
          const sectionPattern = new RegExp(`\\{\\{#section\\s+${action.target}\\}\\}[\\s\\S]*?\\{\\{/section\\}\\}`, 'gi');
          result = result.replace(sectionPattern, '');
          break;

        case 'change_tone':
          // Tone changes would require AI integration
          // For now, just log the intent
          console.log(`Tone change requested: ${action.value}`);
          break;

        case 'add_cta':
          result += `\n\n<a href="${action.value}">${action.target || 'Click Here'}</a>`;
          break;

        case 'custom':
          // Execute custom logic
          console.log(`Custom action: ${action.value}`);
          break;
      }
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
    }, obj as unknown);
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get template performance metrics
   */
  static async getTemplateMetrics(templateId: string): Promise<{
    usageCount: number;
    avgOpenRate?: number;
    avgClickRate?: number;
    totalGenerated: number;
    byStatus: Record<string, number>;
  }> {
    const template = await ContentTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const generated = await GeneratedContent.find({ templateId });
    const byStatus = generated.reduce((acc, g) => {
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const opened = generated.filter(g => g.openedAt).length;
    const clicked = generated.filter(g => g.clickedAt).length;
    const sent = generated.filter(g => g.sentAt).length;

    return {
      usageCount: template.usageCount,
      avgOpenRate: sent > 0 ? (opened / sent) * 100 : undefined,
      avgClickRate: sent > 0 ? (clicked / sent) * 100 : undefined,
      totalGenerated: generated.length,
      byStatus
    };
  }
}
