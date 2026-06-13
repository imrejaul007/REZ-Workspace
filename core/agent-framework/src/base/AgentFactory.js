/**
 * AgentFactory - Creates and manages agent instances
 */
import { v4 as uuidv4 } from 'uuid';
import BaseAgent from './BaseAgent.js';

// Import industry-specific agents
import { LegalAgents } from '../../industries/legal-os/agents/index.js';
import { HealthcareAgents } from '../../industries/healthcare-os/agents/index.js';
import { FinanceAgents } from '../../industries/finance-os/agents/index.js';
import { RetailAgents } from '../../industries/retail-os/agents/index.js';

class AgentFactory {
  constructor(config = {}) {
    this.agents = new Map();
    this.agentRegistry = new Map();
    this.config = config;
    
    // Register built-in agent types
    this._registerBuiltInAgents();
  }

  /**
   * Register built-in agent types by industry
   */
  _registerBuiltInAgents() {
    // Legal OS Agents
    this.registerAgentType('legal', 'case_research', {
      name: 'Legal Case Research Agent',
      role: 'researcher',
      capabilities: ['case_law_search', 'precedent_analysis', 'legal_research']
    });
    
    this.registerAgentType('legal', 'document_draft', {
      name: 'Legal Document Draft Agent',
      role: 'drafter',
      capabilities: ['contract_drafting', 'document_review', 'clause_generation']
    });
    
    this.registerAgentType('legal', 'billing', {
      name: 'Legal Billing Agent',
      role: 'billing',
      capabilities: ['time_tracking', 'invoice_generation', 'expense_management']
    });
    
    this.registerAgentType('legal', 'compliance', {
      name: 'Legal Compliance Agent',
      role: 'compliance',
      capabilities: ['regulatory_check', 'kpi_monitoring', 'audit_trail']
    });
    
    // Healthcare OS Agents
    this.registerAgentType('healthcare', 'patient_intake', {
      name: 'Patient Intake Agent',
      role: 'intake',
      capabilities: ['patient_registration', 'symptom_analysis', 'appointment_scheduling']
    });
    
    this.registerAgentType('healthcare', 'medical_coding', {
      name: 'Medical Coding Agent',
      role: 'coder',
      capabilities: ['icd_coding', 'cpt_coding', 'code_validation']
    });
    
    this.registerAgentType('healthcare', 'claims', {
      name: 'Healthcare Claims Agent',
      role: 'claims_processor',
      capabilities: ['claim_submission', 'denial_management', 'eligibility_check']
    });
    
    // Finance OS Agents
    this.registerAgentType('finance', 'bookkeeping', {
      name: 'Finance Bookkeeping Agent',
      role: 'bookkeeper',
      capabilities: ['transaction_categorization', 'reconciliation', 'report_generation']
    });
    
    this.registerAgentType('finance', 'invoicing', {
      name: 'Finance Invoicing Agent',
      role: 'invoicer',
      capabilities: ['invoice_generation', 'payment_tracking', 'reminder_sending']
    });
    
    this.registerAgentType('finance', 'tax', {
      name: 'Finance Tax Agent',
      role: 'tax_specialist',
      capabilities: ['tax_calculation', 'form_generation', 'deadline_tracking']
    });
    
    // Retail OS Agents
    this.registerAgentType('retail', 'inventory', {
      name: 'Retail Inventory Agent',
      role: 'inventory_manager',
      capabilities: ['stock_tracking', 'reorder_automation', 'demand_forecasting']
    });
    
    this.registerAgentType('retail', 'pos', {
      name: 'Retail POS Agent',
      role: 'pos_operator',
      capabilities: ['transaction_processing', 'customer_lookup', 'loyalty_management']
    });
    
    this.registerAgentType('retail', 'upsell', {
      name: 'Retail Upsell Agent',
      role: 'sales_associate',
      capabilities: ['product_recommendation', 'cross_selling', 'promotion_matching']
    });
  }

  /**
   * Register a new agent type
   */
  registerAgentType(industry, type, config) {
    const key = `${industry}:${type}`;
    this.agentRegistry.set(key, {
      industry,
      type,
      ...config
    });
  }

  /**
   * Create an agent instance
   */
  create(industry, type, options = {}) {
    const key = `${industry}:${type}`;
    const template = this.agentRegistry.get(key);
    
    if (!template) {
      throw new Error(`Unknown agent type: ${key}`);
    }
    
    const agentConfig = {
      id: options.id || uuidv4(),
      name: options.name || template.name,
      industry: template.industry,
      role: template.role,
      capabilities: options.capabilities || template.capabilities,
      maxRequests: options.maxRequests || 40,
      windowMs: options.windowMs || 60000,
      logLevel: options.logLevel || 'info'
    };
    
    const agent = new BaseAgent(agentConfig);
    
    // Attach industry-specific tools
    this._attachTools(agent, industry, type);
    
    // Store reference
    this.agents.set(agentConfig.id, agent);
    
    return agent;
  }

  /**
   * Attach appropriate tools based on industry and type
   */
  _attachTools(agent, industry, type) {
    // Universal tools for all agents
    const universalTools = [
      {
        name: 'get_time',
        description: 'Get current date and time',
        execute: () => new Date().toISOString()
      },
      {
        name: 'search_knowledge',
        description: 'Search internal knowledge base',
        execute: async (params) => agent.searchMemory(params.query)
      },
      {
        name: 'log_activity',
        description: 'Log activity to agent memory',
        execute: (params) => agent._addToMemory(params.entry)
      }
    ];
    
    agent.registerTools(universalTools);
    
    // Industry-specific tools
    const industryTools = this._getIndustryTools(industry, type);
    agent.registerTools(industryTools);
  }

  /**
   * Get tools for specific industry and agent type
   */
  _getIndustryTools(industry, type) {
    const toolsMap = {
      'legal:case_research': [
        { name: 'search_cases', description: 'Search case law database' },
        { name: 'get_precedents', description: 'Get relevant legal precedents' },
        { name: 'analyze_legal_issue', description: 'Analyze legal issue and provide guidance' }
      ],
      'legal:document_draft': [
        { name: 'draft_contract', description: 'Draft legal contract' },
        { name: 'review_document', description: 'Review legal document' },
        { name: 'generate_clause', description: 'Generate specific contract clause' }
      ],
      'legal:billing': [
        { name: 'track_time', description: 'Track billable time' },
        { name: 'generate_invoice', description: 'Generate client invoice' },
        { name: 'process_expense', description: 'Process expense entry' }
      ],
      'healthcare:patient_intake': [
        { name: 'register_patient', description: 'Register new patient' },
        { name: 'collect_symptoms', description: 'Collect patient symptoms' },
        { name: 'schedule_appointment', description: 'Schedule appointment' }
      ],
      'healthcare:medical_coding': [
        { name: 'assign_icd', description: 'Assign ICD-10 code' },
        { name: 'assign_cpt', description: 'Assign CPT code' },
        { name: 'validate_codes', description: 'Validate diagnosis codes' }
      ],
      'finance:bookkeeping': [
        { name: 'categorize_transaction', description: 'Categorize financial transaction' },
        { name: 'reconcile_account', description: 'Reconcile account' },
        { name: 'generate_report', description: 'Generate financial report' }
      ],
      'retail:inventory': [
        { name: 'check_stock', description: 'Check inventory levels' },
        { name: 'reorder_item', description: 'Place reorder' },
        { name: 'update_stock', description: 'Update stock count' }
      ],
      'retail:upsell': [
        { name: 'recommend_product', description: 'Recommend product to customer' },
        { name: 'check_promotions', description: 'Check active promotions' },
        { name: 'apply_discount', description: 'Apply discount to purchase' }
      ]
    };
    
    return toolsMap[`${industry}:${type}`] || [];
  }

  /**
   * Get agent by ID
   */
  get(id) {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAll() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by industry
   */
  getByIndustry(industry) {
    return this.getAll().filter(a => a.industry === industry);
  }

  /**
   * Remove agent
   */
  remove(id) {
    const agent = this.agents.get(id);
    if (agent) {
      agent.reset();
      this.agents.delete(id);
    }
  }

  /**
   * Create agent team (multiple agents working together)
   */
  createTeam(teamConfig) {
    const { name, industry, agents: agentConfigs } = teamConfig;
    
    const team = {
      id: uuidv4(),
      name,
      industry,
      agents: [],
      sharedContext: {},
      
      async execute(task, orchestrator = 'auto') {
        const results = [];
        
        // Sequential execution
        if (orchestrator === 'sequential') {
          for (const config of agentConfigs) {
            const agent = this.agents.find(a => 
              a.name === config.name || a.role === config.role
            );
            if (agent) {
              const result = await agent.execute(task, this.sharedContext);
              results.push(result);
              this.sharedContext = { ...this.sharedContext, ...result };
            }
          }
        }
        
        // Parallel execution
        if (orchestrator === 'parallel') {
          const promises = this.agents.map(agent => 
            agent.execute(task, this.sharedContext)
          );
          const parallelResults = await Promise.all(promises);
          results.push(...parallelResults);
        }
        
        return results;
      },
      
      getStatus() {
        return {
          name: this.name,
          agentCount: this.agents.length,
          agents: this.agents.map(a => a.getStatus())
        };
      }
    };
    
    // Create agents for team
    for (const config of agentConfigs) {
      try {
        const agent = this.create(industry, config.type, {
          name: config.name,
          capabilities: config.capabilities
        });
        team.agents.push(agent);
      } catch (e) {
        console.warn(`Failed to create team agent: ${config.name}`);
      }
    }
    
    return team;
  }

  /**
   * Get list of available agent types
   */
  getAvailableTypes() {
    const types = [];
    this.agentRegistry.forEach((config, key) => {
      const [industry, type] = key.split(':');
      types.push({ industry, type, ...config });
    });
    return types;
  }
}

export default AgentFactory;
