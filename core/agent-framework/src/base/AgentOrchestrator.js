/**
 * AgentOrchestrator - Coordinates multiple agents for complex tasks
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * Orchestration strategies
 */
export const STRATEGIES = {
  SEQUENTIAL: 'sequential',      // One agent after another
  PARALLEL: 'parallel',          // All agents at once
  PIPELINE: 'pipeline',           // Output of one feeds into next
  HIERARCHICAL: 'hierarchical',   // Manager delegates to workers
  CONSENSUS: 'consensus'         // Multiple agents vote on result
};

/**
 * AgentOrchestrator - Coordinates agent execution
 */
class AgentOrchestrator {
  constructor(config = {}) {
    this.id = uuidv4();
    this.agents = new Map();
    this.strategy = config.strategy || STRATEGIES.SEQUENTIAL;
    this.context = config.context || {};
    this.results = [];
    this.history = [];
  }

  /**
   * Add agent to orchestrator
   */
  addAgent(agent, role = 'worker') {
    this.agents.set(agent.id, { agent, role });
    return this;
  }

  /**
   * Remove agent
   */
  removeAgent(agentId) {
    this.agents.delete(agentId);
    return this;
  }

  /**
   * Execute orchestration
   */
  async execute(task, options = {}) {
    const executionId = uuidv4();
    const strategy = options.strategy || this.strategy;
    
    this.results = [];
    
    switch (strategy) {
      case STRATEGIES.SEQUENTIAL:
        return await this._executeSequential(task, options);
      case STRATEGIES.PARALLEL:
        return await this._executeParallel(task, options);
      case STRATEGIES.PIPELINE:
        return await this._executePipeline(task, options);
      case STRATEGIES.HIERARCHICAL:
        return await this._executeHierarchical(task, options);
      case STRATEGIES.CONSENSUS:
        return await this._executeConsensus(task, options);
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  /**
   * Sequential execution - agents run one after another
   */
  async _executeSequential(task, options = {}) {
    const agentList = this._getAgentList(options.agents);
    let currentResult = null;
    
    for (const agentInfo of agentList) {
      const result = await agentInfo.agent.execute(task, {
        ...this.context,
        previousResult: currentResult
      });
      
      this.results.push({
        agentId: agentInfo.agent.id,
        agentName: agentInfo.agent.name,
        result
      });
      
      if (options.stopOnError && !result.success) {
        break;
      }
      
      currentResult = result;
    }
    
    return this._formatResults();
  }

  /**
   * Parallel execution - all agents run simultaneously
   */
  async _executeParallel(task, options = {}) {
    const agentList = this._getAgentList(options.agents);
    
    const promises = agentList.map(async (agentInfo) => {
      try {
        const result = await agentInfo.agent.execute(task, this.context);
        return { agentId: agentInfo.agent.id, result, error: null };
      } catch (error) {
        return { agentId: agentInfo.agent.id, result: null, error: error.message };
      }
    });
    
    const parallelResults = await Promise.allSettled(promises);
    
    parallelResults.forEach((pr, idx) => {
      if (pr.status === 'fulfilled') {
        this.results.push({
          agentId: pr.value.agentId,
          agentName: agentList[idx].agent.name,
          ...pr.value
        });
      }
    });
    
    return this._formatResults();
  }

  /**
   * Pipeline execution - output of each agent feeds into the next
   */
  async _executePipeline(task, options = {}) {
    const agentList = this._getAgentList(options.agents);
    let currentInput = task;
    
    for (const agentInfo of agentList) {
      const result = await agentInfo.agent.execute(currentInput, {
        ...this.context,
        pipelineInput: currentInput
      });
      
      this.results.push({
        agentId: agentInfo.agent.id,
        agentName: agentInfo.agent.name,
        result,
        input: currentInput
      });
      
      if (result.success) {
        currentInput = result.result;
      }
      
      if (options.stopOnError && !result.success) {
        break;
      }
    }
    
    return this._formatResults();
  }

  /**
   * Hierarchical execution - manager delegates to workers
   */
  async _executeHierarchical(task, options = {}) {
    const managerList = this._getAgentsByRole('manager');
    const workerList = this._getAgentsByRole('worker');
    
    if (managerList.length === 0) {
      throw new Error('No manager agent configured for hierarchical execution');
    }
    
    const manager = managerList[0].agent;
    
    // Manager analyzes task and delegates
    const delegation = await manager.execute(task, {
      ...this.context,
      availableWorkers: workerList.map(w => ({
        id: w.agent.id,
        name: w.agent.name,
        capabilities: w.agent.capabilities
      }))
    });
    
    if (!delegation.success) {
      return { success: false, error: 'Manager failed to delegate' };
    }
    
    // Execute delegated subtasks on workers
    const subtasks = delegation.result?.subtasks || [];
    
    for (const subtask of subtasks) {
      const worker = workerList.find(w => 
        w.agent.id === subtask.workerId || 
        w.agent.capabilities.includes(subtask.requiredCapability)
      );
      
      if (worker) {
        const result = await worker.agent.execute(subtask.task, {
          ...this.context,
          parentTask: task
        });
        
        this.results.push({
          agentId: worker.agent.id,
          agentName: worker.agent.name,
          result,
          subtask
        });
      }
    }
    
    // Manager synthesizes results
    const synthesis = await manager.execute({
      type: 'synthesize',
      subtaskResults: this.results.map(r => r.result)
    }, this.context);
    
    this.results.push({
      agentId: manager.id,
      agentName: manager.name,
      result: synthesis,
      isSynthesis: true
    });
    
    return this._formatResults();
  }

  /**
   * Consensus execution - multiple agents vote on result
   */
  async _executeConsensus(task, options = {}) {
    const agentList = this._getAgentList(options.agents);
    const threshold = options.threshold || Math.ceil(agentList.length / 2);
    
    // Get proposals from all agents
    const proposals = await Promise.all(
      agentList.map(async (agentInfo) => {
        const result = await agentInfo.agent.execute(task, this.context);
        return {
          agentId: agentInfo.agent.id,
          agentName: agentInfo.agent.name,
          proposal: result.result,
          success: result.success
        };
      })
    );
    
    // Count votes (simplified - in production would use semantic similarity)
    const votes = {};
    proposals.forEach(p => {
      if (p.success) {
        const key = JSON.stringify(p.proposal);
        votes[key] = (votes[key] || 0) + 1;
      }
    });
    
    // Find consensus
    let consensusResult = null;
    let maxVotes = 0;
    
    Object.entries(votes).forEach(([key, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        consensusResult = JSON.parse(key);
      }
    });
    
    const reachedConsensus = maxVotes >= threshold;
    
    this.results = proposals;
    
    return {
      success: reachedConsensus,
      consensus: reachedConsensus ? consensusResult : null,
      votes: maxVotes,
      threshold,
      proposals: this.results,
      metadata: {
        executionId: this.id,
        strategy: STRATEGIES.CONSENSUS
      }
    };
  }

  /**
   * Get list of agents to execute
   */
  _getAgentList(agentIds) {
    if (agentIds && agentIds.length > 0) {
      return agentIds
        .map(id => this.agents.get(id))
        .filter(Boolean);
    }
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by role
   */
  _getAgentsByRole(role) {
    return Array.from(this.agents.values()).filter(a => a.role === role);
  }

  /**
   * Format results for output
   */
  _formatResults() {
    return {
      success: this.results.every(r => r.result?.success),
      results: this.results,
      metadata: {
        executionId: this.id,
        strategy: this.strategy,
        agentCount: this.results.length
      }
    };
  }

  /**
   * Get execution history
   */
  getHistory() {
    return this.history;
  }

  /**
   * Clear results
   */
  clear() {
    this.results = [];
    return this;
  }
}

export default AgentOrchestrator;
