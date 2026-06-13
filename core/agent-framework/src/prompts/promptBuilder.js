/**
 * PromptBuilder - Constructs prompts for LLMs
 */

/**
 * Industry-specific system prompts
 */
export const INDUSTRY_PROMPTS = {
  legal: {
    system: `You are a legal AI assistant specializing in {specialty}. 
Provide accurate, well-cited legal information. Always include disclaimers about consulting qualified legal professionals.
Focus areas: {focusAreas}`,
    
    caseAnalysis: `Analyze this legal case:
Case: {caseDescription}
Issues: {issues}
Required Analysis: {analysisType}

Provide:
1. Summary of key facts
2. Applicable legal principles
3. Analysis of strengths/weaknesses
4. Recommended strategy`,

    documentDraft: `Draft a {documentType} for:
Client: {clientName}
Purpose: {purpose}
Jurisdiction: {jurisdiction}

Requirements:
{requirements}

Ensure compliance with {jurisdiction} law and professional standards.`
  },

  healthcare: {
    system: `You are a healthcare AI assistant specializing in {specialty}.
Provide accurate medical information while emphasizing the importance of professional medical advice.
Focus areas: {focusAreas}`,

    patientIntake: `Process patient intake information:
Patient: {patientName}
Chief Complaint: {chiefComplaint}
Symptoms: {symptoms}

Provide:
1. Initial assessment notes
2. Relevant questions to ask
3. Recommended next steps
4. Urgency classification`
  },

  finance: {
    system: `You are a financial AI assistant specializing in {specialty}.
Provide accurate financial analysis while noting this is not financial advice.
Focus areas: {focusAreas}`,

    bookkeeping: `Categorize and process this transaction:
Date: {date}
Description: {description}
Amount: {amount}
Account: {account}

Provide:
1. Category recommendation
2. Suggested account mapping
3. Notes for reconciliation`
  },

  retail: {
    system: `You are a retail AI assistant specializing in {specialty}.
Provide helpful customer service and sales assistance.
Focus areas: {focusAreas}`,

    productRecommendation: `Recommend products for customer:
Customer Profile: {customerProfile}
Purchase History: {purchaseHistory}
Current Interest: {currentInterest}
Budget: {budget}

Provide personalized recommendations with explanations.`
  }
};

/**
 * Universal agent prompts
 */
export const UNIVERSAL_PROMPTS = {
  system: `You are {agentName}, a {agentRole} AI agent in the RTMN Industry OS.
Industry: {industry}
Capabilities: {capabilities}

Always:
- Follow ethical guidelines
- Maintain confidentiality
- Provide accurate, helpful responses
- Ask clarifying questions when needed`,

  taskExecution: `Execute this task:
Task Type: {taskType}
Input: {input}
Context: {context}

Provide a structured response with:
- Analysis
- Action taken
- Results
- Recommendations`,

  escalation: `This task requires escalation:
Original Request: {request}
Reason for Escalation: {reason}
Agent Capabilities: {capabilities}

Provide:
1. Clear explanation of why escalation is needed
2. Recommended escalation path
3. Information to include in escalation`
};

/**
 * PromptBuilder class
 */
export class PromptBuilder {
  constructor(config = {}) {
    this.templates = new Map();
    this.variables = {};
    this.filters = [];
    
    // Register built-in templates
    this._registerBuiltInTemplates();
  }

  /**
   * Register built-in templates
   */
  _registerBuiltInTemplates() {
    // Industry templates
    Object.entries(INDUSTRY_PROMPTS).forEach(([industry, templates]) => {
      Object.entries(templates).forEach(([name, template]) => {
        this.register(`${industry}:${name}`, template);
      });
    });
    
    // Universal templates
    Object.entries(UNIVERSAL_PROMPTS).forEach(([name, template]) => {
      this.register(name, template);
    });
  }

  /**
   * Register a prompt template
   */
  register(name, template) {
    this.templates.set(name, template);
    return this;
  }

  /**
   * Set default variables
   */
  setVariables(vars) {
    this.variables = { ...this.variables, ...vars };
    return this;
  }

  /**
   * Add filter function
   */
  addFilter(filter) {
    this.filters.push(filter);
    return this;
  }

  /**
   * Build prompt from template
   */
  build(templateName, vars = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    // Merge variables
    const mergedVars = { ...this.variables, ...vars };

    // Substitute variables
    let prompt = this._substitute(template, mergedVars);

    // Apply filters
    for (const filter of this.filters) {
      prompt = filter(prompt, mergedVars);
    }

    return prompt;
  }

  /**
   * Substitute variables in template
   */
  _substitute(template, vars) {
    return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, path) => {
      return this._getNestedValue(vars, path) ?? match;
    });
  }

  /**
   * Get nested value from object
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Build system prompt for agent
   */
  buildSystemPrompt(agent) {
    return this.build('system', {
      agentName: agent.name,
      agentRole: agent.role,
      industry: agent.industry,
      capabilities: agent.capabilities.join(', ')
    });
  }

  /**
   * Build few-shot examples
   */
  buildFewShot(examples) {
    return examples.map((ex, i) => 
      `Example ${i + 1}:
Input: ${JSON.stringify(ex.input)}
Output: ${JSON.stringify(ex.output)}`
    ).join('\n\n');
  }
}

/**
 * Create PromptBuilder instance with industry defaults
 */
export function createPromptBuilder(industry, specialty) {
  const builder = new PromptBuilder();
  
  builder.setVariables({
    industry: industry,
    specialty: specialty || 'general'
  });
  
  // Add industry-specific filters
  if (industry === 'legal') {
    builder.addFilter(prompt => 
      prompt + '\n\nImportant: This is not legal advice. Consult a qualified attorney.'
    );
  }
  
  if (industry === 'healthcare') {
    builder.addFilter(prompt =>
      prompt + '\n\nImportant: This is not medical advice. Consult a qualified healthcare provider.'
    );
  }
  
  if (industry === 'finance') {
    builder.addFilter(prompt =>
      prompt + '\n\nImportant: This is not financial advice. Consult a qualified financial advisor.'
    );
  }
  
  return builder;
}

export default PromptBuilder;
