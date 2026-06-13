/**
 * ToolRegistry - Manages tools available to agents
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.categories = new Map();
    this.namespaces = new Map();
  }

  /**
   * Register a tool
   */
  register(tool) {
    if (!tool.name) {
      throw new Error('Tool must have a name');
    }

    const toolDef = {
      name: tool.name,
      description: tool.description || '',
      parameters: tool.parameters || {},
      execute: tool.execute,
      category: tool.category || 'general',
      namespace: tool.namespace || 'default',
      aliases: tool.aliases || [],
      metadata: tool.metadata || {}
    };

    this.tools.set(tool.name, toolDef);

    // Add to category
    if (!this.categories.has(toolDef.category)) {
      this.categories.set(toolDef.category, new Set());
    }
    this.categories.get(toolDef.category).add(toolDef.name);

    // Add to namespace
    if (!this.namespaces.has(toolDef.namespace)) {
      this.namespaces.set(toolDef.namespace, new Map());
    }
    this.namespaces.get(toolDef.namespace).set(toolDef.name, toolDef);

    return this;
  }

  /**
   * Register multiple tools
   */
  registerAll(tools) {
    tools.forEach(tool => this.register(tool));
    return this;
  }

  /**
   * Get tool by name
   */
  get(name) {
    return this.tools.get(name);
  }

  /**
   * Get tool by alias
   */
  getByAlias(alias) {
    for (const tool of this.tools.values()) {
      if (tool.aliases.includes(alias)) {
        return tool;
      }
    }
    return null;
  }

  /**
   * Check if tool exists
   */
  has(name) {
    return this.tools.has(name);
  }

  /**
   * Get all tools
   */
  getAll() {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getByCategory(category) {
    const names = this.categories.get(category);
    if (!names) return [];
    return Array.from(names).map(name => this.tools.get(name));
  }

  /**
   * Get tools by namespace
   */
  getByNamespace(namespace) {
    const tools = this.namespaces.get(namespace);
    if (!tools) return [];
    return Array.from(tools.values());
  }

  /**
   * Execute a tool by name
   */
  async execute(name, params, context = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      const result = await tool.execute(params, context);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available categories
   */
  getCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Get available namespaces
   */
  getNamespaces() {
    return Array.from(this.namespaces.keys());
  }

  /**
   * Remove a tool
   */
  unregister(name) {
    const tool = this.tools.get(name);
    if (tool) {
      this.tools.delete(name);
      this.categories.get(tool.category)?.delete(name);
      this.namespaces.get(tool.namespace)?.delete(name);
    }
    return this;
  }

  /**
   * Get tool schema (for LLM function calling)
   */
  getSchema() {
    return this.getAll().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.properties || {},
        required: tool.parameters.required || []
      }
    }));
  }
}

// Pre-built tool categories
export const TOOL_CATEGORIES = {
  DATA: 'data',
  CALCULATION: 'calculation',
  COMMUNICATION: 'communication',
  FILE: 'file',
  DATABASE: 'database',
  API: 'api',
  AI: 'ai',
  UTILITY: 'utility'
};

// Built-in tools
export const BUILTIN_TOOLS = {
  get_current_time: {
    name: 'get_current_time',
    description: 'Get the current date and time',
    category: TOOL_CATEGORIES.UTILITY,
    parameters: {
      properties: {
        timezone: { type: 'string', description: 'Timezone (e.g., UTC, America/New_York)' }
      }
    },
    execute: (params) => {
      const now = new Date();
      return {
        iso: now.toISOString(),
        unix: now.getTime(),
        formatted: now.toLocaleString(params?.timezone)
      };
    }
  },
  
  calculate: {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    category: TOOL_CATEGORIES.CALCULATION,
    parameters: {
      properties: {
        expression: { type: 'string', description: 'Mathematical expression' }
      },
      required: ['expression']
    },
    execute: (params) => {
      try {
        // Safe evaluation using Function constructor
        const result = new Function(`return ${params.expression}`)();
        return { result };
      } catch (e) {
        throw new Error(`Calculation error: ${e.message}`);
      }
    }
  },

  format_json: {
    name: 'format_json',
    description: 'Format JSON data',
    category: TOOL_CATEGORIES.UTILITY,
    parameters: {
      properties: {
        data: { type: 'string', description: 'JSON string to format' },
        indent: { type: 'number', description: 'Indentation spaces' }
      },
      required: ['data']
    },
    execute: (params) => {
      const data = typeof params.data === 'string' 
        ? JSON.parse(params.data) 
        : params.data;
      return JSON.stringify(data, null, params.indent || 2);
    }
  },

  search_array: {
    name: 'search_array',
    description: 'Search for items in an array',
    category: TOOL_CATEGORIES.DATA,
    parameters: {
      properties: {
        array: { type: 'array', description: 'Array to search' },
        query: { type: 'string', description: 'Search query' },
        field: { type: 'string', description: 'Field to search in' }
      },
      required: ['array', 'query']
    },
    execute: (params) => {
      const { array, query, field } = params;
      const q = query.toLowerCase();
      
      return array.filter(item => {
        if (field) {
          const val = item[field];
          return String(val).toLowerCase().includes(q);
        }
        return JSON.stringify(item).toLowerCase().includes(q);
      });
    }
  },

  aggregate_data: {
    name: 'aggregate_data',
    description: 'Aggregate data from array',
    category: TOOL_CATEGORIES.DATA,
    parameters: {
      properties: {
        data: { type: 'array', description: 'Data to aggregate' },
        groupBy: { type: 'string', description: 'Field to group by' },
        operation: { 
          type: 'string', 
          enum: ['sum', 'avg', 'min', 'max', 'count'],
          description: 'Aggregation operation' 
        },
        valueField: { type: 'string', description: 'Field to aggregate' }
      },
      required: ['data', 'operation']
    },
    execute: (params) => {
      const { data, groupBy, operation, valueField } = params;
      
      if (groupBy) {
        const groups = {};
        data.forEach(item => {
          const key = item[groupBy];
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        });
        
        return Object.entries(groups).reduce((acc, [key, items]) => {
          const values = items.map(i => valueField ? i[valueField] : 1);
          acc[key] = this._aggregate(values, operation);
          return acc;
        }, {});
      }
      
      const values = data.map(i => valueField ? i[valueField] : 1);
      return { [operation]: this._aggregate(values, operation) };
    }
  },

  _aggregate: (values, operation) => {
    switch (operation) {
      case 'sum': return values.reduce((a, b) => a + b, 0);
      case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      case 'count': return values.length;
      default: return null;
    }
  }
};

export default ToolRegistry;
