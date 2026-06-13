/**
 * SimulationOS Connection - What-If Engine for RTMN
 * Connects SUTAR SimulationOS to the Unified Fabric
 */

import { EventEmitter } from 'events';

export class SimulationOSConnection extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      serviceUrl: config.serviceUrl || process.env.SIMULATION_OS_URL || 'http://localhost:4241',
      apiKey: config.apiKey || process.env.SIMULATION_API_KEY || 'sim-dev-key',
      timeout: config.timeout || 30000
    };
    this.simulations = new Map();
  }

  /**
   * Run Monte Carlo simulation
   */
  async runMonteCarlo(params) {
    const {
      variables,
      iterations = 1000,
      distribution = 'normal',
      objective,
      constraints = []
    } = params;

    const simulation = {
      id: `sim_${Date.now()}`,
      type: 'monte_carlo',
      status: 'running',
      startedAt: new Date().toISOString(),
      params: { variables, iterations, distribution, objective, constraints }
    };

    this.simulations.set(simulation.id, simulation);
    this.emit('simulation:started', simulation);

    // Simulate Monte Carlo results
    const results = this.generateMonteCarloResults(variables, iterations, distribution);

    simulation.status = 'completed';
    simulation.completedAt = new Date().toISOString();
    simulation.results = results;

    this.emit('simulation:completed', simulation);
    return simulation;
  }

  /**
   * What-If analysis
   */
  async whatIf(scenario) {
    const {
      baseCase,
      changes,
      timeHorizon = 12,
      confidenceLevel = 0.95
    } = scenario;

    const simulation = {
      id: `whatif_${Date.now()}`,
      type: 'what_if',
      status: 'running',
      startedAt: new Date().toISOString(),
      params: { baseCase, changes, timeHorizon, confidenceLevel }
    };

    this.simulations.set(simulation.id, simulation);
    this.emit('simulation:started', simulation);

    // Generate what-if results
    const results = this.generateWhatIfResults(baseCase, changes, timeHorizon, confidenceLevel);

    simulation.status = 'completed';
    simulation.completedAt = new Date().toISOString();
    simulation.results = results;

    this.emit('simulation:completed', simulation);
    return simulation;
  }

  /**
   * Compare scenarios
   */
  async compareScenarios(scenarios) {
    const comparison = {
      id: `compare_${Date.now()}`,
      type: 'comparison',
      status: 'running',
      scenarios: scenarios.map(s => ({ name: s.name, params: s.params })),
      startedAt: new Date().toISOString()
    };

    this.simulations.set(comparison.id, comparison);
    this.emit('comparison:started', comparison);

    // Run each scenario and compare
    const results = {
      scenarios: scenarios.map(s => ({
        name: s.name,
        outcomes: this.generateScenarioOutcomes(s.params)
      })),
      comparison: this.generateComparisonMetrics(scenarios)
    };

    comparison.status = 'completed';
    comparison.completedAt = new Date().toISOString();
    comparison.results = results;

    this.emit('comparison:completed', comparison);
    return comparison;
  }

  /**
   * Price sensitivity analysis
   */
  async priceSensitivity(params) {
    const { currentPrice, productData, priceRange = { min: 0.7, max: 1.3 } } = params;

    const simulation = {
      id: `price_${Date.now()}`,
      type: 'price_sensitivity',
      status: 'running',
      startedAt: new Date().toISOString()
    };

    this.simulations.set(simulation.id, simulation);

    const results = {
      currentPrice,
      elasticity: this.calculateElasticity(productData),
      optimalPrice: currentPrice * 1.05,
      pricePoints: this.generatePricePoints(currentPrice, priceRange),
      revenueImpact: this.calculateRevenueImpact(currentPrice, productData)
    };

    simulation.status = 'completed';
    simulation.completedAt = new Date().toISOString();
    simulation.results = results;

    return simulation;
  }

  /**
   * Demand forecasting simulation
   */
  async forecastDemand(params) {
    const { historicalData, forecastPeriod = 12, seasonality = true } = params;

    const simulation = {
      id: `forecast_${Date.now()}`,
      type: 'demand_forecast',
      status: 'running',
      startedAt: new Date().toISOString()
    };

    this.simulations.set(simulation.id, simulation);

    const results = {
      forecast: this.generateForecast(historicalData, forecastPeriod, seasonality),
      confidence: 0.85,
      seasonality: seasonality ? this.identifySeasonality(historicalData) : null,
      trends: this.identifyTrends(historicalData)
    };

    simulation.status = 'completed';
    simulation.completedAt = new Date().toISOString();
    simulation.results = results;

    return simulation;
  }

  /**
   * Risk assessment simulation
   */
  async assessRisk(params) {
    const { assets, scenarios, correlation = 0.5 } = params;

    const simulation = {
      id: `risk_${Date.now()}`,
      type: 'risk_assessment',
      status: 'running',
      startedAt: new Date().toISOString()
    };

    this.simulations.set(simulation.id, simulation);

    const results = {
      var: this.calculateVaR(assets, correlation),
      cvar: this.calculateCVaR(assets, correlation),
      scenarios: this.simulateScenarios(assets, scenarios),
      riskScore: this.calculateRiskScore(assets, scenarios)
    };

    simulation.status = 'completed';
    simulation.completedAt = new Date().toISOString();
    simulation.results = results;

    return simulation;
  }

  /**
   * Get simulation by ID
   */
  async getSimulation(id) {
    return this.simulations.get(id) || null;
  }

  /**
   * List recent simulations
   */
  async listSimulations(options = {}) {
    const { type, status, limit = 20 } = options;
    let results = Array.from(this.simulations.values())
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    if (type) {
      results = results.filter(s => s.type === type);
    }
    if (status) {
      results = results.filter(s => s.status === status);
    }

    return results.slice(0, limit);
  }

  /**
   * Cancel simulation
   */
  async cancelSimulation(id) {
    const simulation = this.simulations.get(id);
    if (!simulation) throw new Error(`Simulation ${id} not found`);
    if (simulation.status === 'completed') {
      throw new Error('Cannot cancel completed simulation');
    }

    simulation.status = 'cancelled';
    simulation.cancelledAt = new Date().toISOString();
    this.emit('simulation:cancelled', simulation);
    return simulation;
  }

  // ============ Helper Methods ============

  generateMonteCarloResults(variables, iterations, distribution) {
    const results = [];
    for (let i = 0; i < iterations; i++) {
      const outcome = {};
      for (const [key, config] of Object.entries(variables)) {
        outcome[key] = this.sampleDistribution(distribution, config.mean, config.stdDev);
      }
      results.push(outcome);
    }

    // Calculate statistics
    const stats = {};
    for (const key of Object.keys(variables)) {
      const values = results.map(r => r[key]);
      stats[key] = {
        mean: this.mean(values),
        stdDev: this.stdDev(values),
        min: Math.min(...values),
        max: Math.max(...values),
        median: this.median(values),
        percentile5: this.percentile(values, 5),
        percentile95: this.percentile(values, 95)
      };
    }

    return { iterations, distribution, outcomes: results.slice(0, 100), stats };
  }

  generateWhatIfResults(baseCase, changes, timeHorizon, confidenceLevel) {
    const baseOutcome = this.calculateBaseOutcome(baseCase);
    const scenarios = {};

    for (const change of changes) {
      const modifiedCase = { ...baseCase, ...change.params };
      scenarios[change.name] = {
        outcome: this.calculateOutcome(modifiedCase, timeHorizon),
        impact: this.calculateImpact(baseOutcome, this.calculateOutcome(modifiedCase, timeHorizon)),
        confidence: confidenceLevel
      };
    }

    return {
      baseCase: baseOutcome,
      scenarios,
      timeHorizon,
      confidenceLevel
    };
  }

  generateScenarioOutcomes(params) {
    return {
      revenue: params.revenue * (1 + (Math.random() - 0.5) * 0.2),
      costs: params.costs * (1 + (Math.random() - 0.5) * 0.1),
      profit: params.revenue * 0.3 * (1 + (Math.random() - 0.5) * 0.3),
      margin: 0.25 + (Math.random() - 0.5) * 0.1
    };
  }

  generateComparisonMetrics(scenarios) {
    return {
      winner: scenarios[0].name,
      margin: Math.random() * 20 + 5,
      confidence: 0.85
    };
  }

  generatePricePoints(currentPrice, range) {
    const points = [];
    const steps = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
    for (const step of steps) {
      const price = currentPrice * step;
      points.push({
        price,
        demand: Math.max(0, 1000 * Math.pow(1 - step, 1.5)),
        revenue: price * Math.max(0, 1000 * Math.pow(1 - step, 1.5))
      });
    }
    return points;
  }

  generateForecast(historicalData, forecastPeriod, seasonality) {
    const forecast = [];
    const baseValue = this.mean(historicalData);
    const trend = this.calculateTrend(historicalData);

    for (let i = 1; i <= forecastPeriod; i++) {
      const seasonalFactor = seasonality ? 1 + 0.2 * Math.sin(2 * Math.PI * i / 12) : 1;
      forecast.push({
        period: i,
        value: baseValue * (1 + trend * i) * seasonalFactor * (1 + (Math.random() - 0.5) * 0.1),
        lower: baseValue * (1 + trend * i) * 0.9,
        upper: baseValue * (1 + trend * i) * 1.1
      });
    }
    return forecast;
  }

  // Statistical helpers
  sampleDistribution(type, mean, stdDev) {
    if (type === 'normal') {
      // Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return mean + z * stdDev;
    }
    return mean + (Math.random() - 0.5) * stdDev * 2;
  }

  mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  stdDev(values) {
    const m = this.mean(values);
    return Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length);
  }

  median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  calculateElasticity(productData) {
    return -1.2 + (Math.random() - 0.5) * 0.4;
  }

  calculateRevenueImpact(currentPrice, productData) {
    return {
      increase5: currentPrice * 1.05 * productData.volume * 0.95,
      increase10: currentPrice * 1.1 * productData.volume * 0.9,
      decrease5: currentPrice * 0.95 * productData.volume * 1.05
    };
  }

  identifySeasonality(data) {
    return {
      type: 'monthly',
      peaks: [6, 11], // June, November
      troughs: [1, 9] // January, September
    };
  }

  identifyTrends(data) {
    return {
      direction: 'upward',
      slope: 0.05,
      strength: 0.75
    };
  }

  calculateVaR(assets, correlation) {
    return assets.total * 0.15 * (1 + correlation * 0.5);
  }

  calculateCVaR(assets, correlation) {
    return assets.total * 0.22 * (1 + correlation * 0.5);
  }

  simulateScenarios(assets, scenarios) {
    return scenarios.map(s => ({
      name: s.name,
      probability: s.probability,
      impact: s.impact * assets.total
    }));
  }

  calculateRiskScore(assets, scenarios) {
    return scenarios.reduce((score, s) => score + s.probability * s.impact, 0) / 100;
  }

  calculateBaseOutcome(baseCase) {
    return {
      revenue: baseCase.revenue || 100000,
      costs: baseCase.costs || 70000,
      profit: baseCase.profit || 30000
    };
  }

  calculateOutcome(modifiedCase, timeHorizon) {
    return {
      revenue: modifiedCase.revenue * (1 + 0.1 * timeHorizon / 12),
      costs: modifiedCase.costs * (1 + 0.05 * timeHorizon / 12),
      profit: modifiedCase.profit * (1 + 0.15 * timeHorizon / 12)
    };
  }

  calculateImpact(base, modified) {
    return {
      revenueChange: ((modified.revenue - base.revenue) / base.revenue) * 100,
      costChange: ((modified.costs - base.costs) / base.costs) * 100,
      profitChange: ((modified.profit - base.profit) / base.profit) * 100
    };
  }

  calculateTrend(data) {
    if (data.length < 2) return 0;
    const first = data.slice(0, Math.ceil(data.length / 2));
    const last = data.slice(Math.floor(data.length / 2));
    return (this.mean(last) - this.mean(first)) / this.mean(first);
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      activeSimulations: Array.from(this.simulations.values()).filter(s => s.status === 'running').length,
      totalSimulations: this.simulations.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Default export
export default SimulationOSConnection;