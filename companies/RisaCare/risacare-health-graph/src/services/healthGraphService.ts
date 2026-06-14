/**
 * Health Knowledge Graph Service
 *
 * Graph relationships and intelligence for health data
 * Following RTNM Doctrine: Memory → Knowledge Graph → Twin → Intelligence
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GraphNode,
  GraphNodeType,
  GraphRelationship,
  GraphRelationshipType,
  HealthKnowledgeGraph,
  SymptomAnalysis,
  ConditionAnalysis,
  MedicationAnalysis,
  GraphInsight,
  HealthCorrelation,
  KnowledgeExtractionInput
} from '../types/index.js';

// In-memory graph storage (will be replaced with Neo4j in production)
class GraphStore {
  private graphs: Map<string, HealthKnowledgeGraph> = new Map();

  async getGraph(personId: string): Promise<HealthKnowledgeGraph | null> {
    return this.graphs.get(personId) || null;
  }

  async saveGraph(graph: HealthKnowledgeGraph): Promise<void> {
    this.graphs.set(graph.personId, graph);
  }

  async addNode(personId: string, node: GraphNode): Promise<void> {
    let graph = await this.getGraph(personId);
    if (!graph) {
      graph = {
        personId,
        nodes: [],
        relationships: [],
        metadata: { totalNodes: 0, totalRelationships: 0, lastUpdated: new Date().toISOString(), confidence: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Check if node already exists
    const existingIndex = graph.nodes.findIndex(n => n.id === node.id);
    if (existingIndex >= 0) {
      graph.nodes[existingIndex] = node;
    } else {
      graph.nodes.push(node);
    }

    graph.metadata.totalNodes = graph.nodes.length;
    graph.metadata.lastUpdated = new Date().toISOString();
    await this.saveGraph(graph);
  }

  async addRelationship(personId: string, relationship: GraphRelationship): Promise<void> {
    let graph = await this.getGraph(personId);
    if (!graph) {
      graph = {
        personId,
        nodes: [],
        relationships: [],
        metadata: { totalNodes: 0, totalRelationships: 0, lastUpdated: new Date().toISOString(), confidence: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const existingIndex = graph.relationships.findIndex(r => r.id === relationship.id);
    if (existingIndex >= 0) {
      graph.relationships[existingIndex] = relationship;
    } else {
      graph.relationships.push(relationship);
    }

    graph.metadata.totalRelationships = graph.relationships.length;
    graph.metadata.lastUpdated = new Date().toISOString();
    await this.saveGraph(graph);
  }

  async findNode(personId: string, nodeId: string): Promise<GraphNode | null> {
    const graph = await this.getGraph(personId);
    return graph?.nodes.find(n => n.id === nodeId) || null;
  }

  async findNodesByType(personId: string, type: GraphNodeType): Promise<GraphNode[]> {
    const graph = await this.getGraph(personId);
    return graph?.nodes.filter(n => n.type === type) || [];
  }

  async findRelationships(personId: string, options: {
    fromNodeId?: string;
    toNodeId?: string;
    type?: GraphRelationshipType;
  }): Promise<GraphRelationship[]> {
    const graph = await this.getGraph(personId);
    if (!graph) return [];

    return graph.relationships.filter(r => {
      if (options.fromNodeId && r.sourceNodeId !== options.fromNodeId) return false;
      if (options.toNodeId && r.targetNodeId !== options.toNodeId) return false;
      if (options.type && r.type !== options.type) return false;
      return true;
    });
  }
}

export class HealthGraphService {
  private store: GraphStore = new GraphStore();

  // ============================================
  // GRAPH INITIALIZATION
  // ============================================

  /**
   * Initialize or get existing health graph for a person
   */
  async getOrCreateGraph(personId: string): Promise<HealthKnowledgeGraph> {
    let graph = await this.store.getGraph(personId);
    if (!graph) {
      graph = {
        personId,
        nodes: [],
        relationships: [],
        metadata: {
          totalNodes: 0,
          totalRelationships: 0,
          lastUpdated: new Date().toISOString(),
          confidence: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await this.store.saveGraph(graph);
    }
    return graph;
  }

  // ============================================
  // NODE MANAGEMENT
  // ============================================

  /**
   * Add a node to the health graph
   */
  async addNode(personId: string, type: GraphNodeType, name: string, properties?: {
    description?: string;
    value?: any;
    metadata?: Record<string, any>;
  }): Promise<GraphNode> {
    const node: GraphNode = {
      id: uuidv4(),
      type,
      properties: {
        name,
        description: properties?.description,
        value: properties?.value,
        metadata: properties?.metadata || {}
      },
      source: 'user_input',
      confidence: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.store.addNode(personId, node);
    return node;
  }

  /**
   * Add multiple nodes from extracted knowledge
   */
  async addNodes(personId: string, nodes: Array<{
    type: GraphNodeType;
    name: string;
    description?: string;
    value?: any;
  }>): Promise<GraphNode[]> {
    const addedNodes: GraphNode[] = [];
    for (const nodeData of nodes) {
      const node = await this.addNode(personId, nodeData.type, nodeData.name, {
        description: nodeData.description,
        value: nodeData.value
      });
      addedNodes.push(node);
    }
    return addedNodes;
  }

  /**
   * Get all nodes for a person
   */
  async getNodes(personId: string, type?: GraphNodeType): Promise<GraphNode[]> {
    if (type) {
      return this.store.findNodesByType(personId, type);
    }
    const graph = await this.store.getGraph(personId);
    return graph?.nodes || [];
  }

  // ============================================
  // RELATIONSHIP MANAGEMENT
  // ============================================

  /**
   * Create a relationship between two nodes
   */
  async createRelationship(
    personId: string,
    sourceNodeId: string,
    targetNodeId: string,
    type: GraphRelationshipType,
    properties?: {
      weight?: number;
      description?: string;
      evidence?: string[];
    }
  ): Promise<GraphRelationship> {
    const relationship: GraphRelationship = {
      id: uuidv4(),
      sourceNodeId,
      targetNodeId,
      type,
      properties: {
        weight: properties?.weight || 0.5,
        description: properties?.description,
        evidence: properties?.evidence || []
      },
      source: 'user_input',
      confidence: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.store.addRelationship(personId, relationship);
    return relationship;
  }

  /**
   * Get relationships for a node
   */
  async getNodeRelationships(personId: string, nodeId: string): Promise<GraphRelationship[]> {
    const outgoing = await this.store.findRelationships(personId, { fromNodeId: nodeId });
    const incoming = await this.store.findRelationships(personId, { toNodeId: nodeId });
    return [...outgoing, ...incoming];
  }

  // ============================================
  // KNOWLEDGE EXTRACTION
  // ============================================

  /**
   * Extract knowledge from text (medical reports, notes, etc.)
   */
  async extractKnowledge(personId: string, input: KnowledgeExtractionInput): Promise<{
    nodes: GraphNode[];
    relationships: GraphRelationship[];
    insights: GraphInsight[];
  }> {
    // Simple keyword-based extraction (will be replaced with AI in production)
    const extractedNodes: GraphNode[] = [];
    const extractedRelationships: GraphRelationship[] = [];
    const insights: GraphInsight[] = [];

    const text = input.text.toLowerCase();

    // Extract conditions
    const conditions = ['diabetes', 'hypertension', 'asthma', 'pcod', 'pcos', 'thyroid', 'anemia', 'migraine', 'depression', 'anxiety'];
    for (const condition of conditions) {
      if (text.includes(condition)) {
        const node = await this.addNode(personId, 'CONDITION', condition);
        extractedNodes.push(node);

        // Link to person
        const personNode = await this.getOrCreatePersonNode(personId);
        const rel = await this.createRelationship(personId, personNode.id, node.id, 'HAS_CONDITION');
        extractedRelationships.push(rel);
      }
    }

    // Extract symptoms
    const symptoms = ['fatigue', 'headache', 'nausea', 'pain', 'dizziness', 'bloating', 'cramps', 'acne', 'mood swings', 'insomnia'];
    for (const symptom of symptoms) {
      if (text.includes(symptom)) {
        const node = await this.addNode(personId, 'SYMPTOM', symptom);
        extractedNodes.push(node);

        const personNode = await this.getOrCreatePersonNode(personId);
        const rel = await this.createRelationship(personId, personNode.id, node.id, 'EXPERIENCES_SYMPTOM');
        extractedRelationships.push(rel);
      }
    }

    // Extract medications
    const medications = ['metformin', 'thyronorm', 'd3', 'folic acid', 'paracetamol', 'ibuprofen', 'omeprazole', 'vitamin b12'];
    for (const medication of medications) {
      if (text.includes(medication)) {
        const node = await this.addNode(personId, 'MEDICATION', medication);
        extractedNodes.push(node);

        const personNode = await this.getOrCreatePersonNode(personId);
        const rel = await this.createRelationship(personId, personNode.id, node.id, 'TAKES_MEDICATION');
        extractedRelationships.push(rel);
      }
    }

    // Generate insights based on patterns
    if (extractedNodes.length > 3) {
      insights.push({
        type: 'pattern',
        title: 'Health Pattern Detected',
        description: `Found ${extractedNodes.length} health indicators in the provided text. This suggests a comprehensive health profile.`,
        confidence: 0.8,
        evidence: extractedNodes.map(n => n.properties.name),
        relatedNodes: extractedNodes.map(n => n.id)
      });
    }

    return { nodes: extractedNodes, relationships: extractedRelationships, insights };
  }

  /**
   * Get or create person node in graph
   */
  private async getOrCreatePersonNode(personId: string): Promise<GraphNode> {
    const nodes = await this.store.findNodesByType(personId, 'PERSON');
    if (nodes.length > 0) return nodes[0];

    return this.addNode(personId, 'PERSON', `Person-${personId.substring(0, 8)}`);
  }

  // ============================================
  // SYMPTOM ANALYSIS
  // ============================================

  /**
   * Analyze a symptom and find possible causes
   */
  async analyzeSymptom(personId: string, symptomName: string): Promise<SymptomAnalysis> {
    // Get all nodes and relationships
    const nodes = await this.getNodes(personId);
    const graph = await this.store.getGraph(personId);

    // Find related conditions
    const symptomNode = nodes.find(n => n.type === 'SYMPTOM' && n.properties.name.toLowerCase() === symptomName.toLowerCase());
    const conditions = nodes.filter(n => n.type === 'CONDITION');

    // Find medications
    const medications = nodes.filter(n => n.type === 'MEDICATION');

    // Build analysis
    const possibleCauses: SymptomAnalysis['possibleCauses'] = conditions.map(c => ({
      condition: c.properties.name,
      probability: 0.5, // Placeholder - would use ML in production
      supportingEvidence: [],
      relatedSymptoms: []
    }));

    const relatedMedications: SymptomAnalysis['relatedMedications'] = medications.map(m => ({
      medication: m.properties.name,
      effect: 'treats' as const,
      relevance: 0.5
    }));

    return {
      symptom: symptomName,
      possibleCauses,
      relatedMedications,
      recommendations: this.generateSymptomRecommendations(symptomName)
    };
  }

  private generateSymptomRecommendations(symptom: string): string[] {
    const recommendations: Record<string, string[]> = {
      'fatigue': [
        'Check your sleep patterns - aim for 7-8 hours',
        'Consider iron-rich foods if fatigue persists',
        'Monitor your energy levels throughout the day'
      ],
      'headache': [
        'Stay hydrated - aim for 8 glasses of water daily',
        'Take regular breaks from screens',
        'Consider stress management techniques'
      ],
      'cramps': [
        'Apply heat to affected area',
        'Stay hydrated and consider magnesium supplements',
        'Light exercise can help relieve cramps'
      ],
      'bloating': [
        'Track food triggers that cause bloating',
        'Eat smaller, more frequent meals',
        'Consider digestive enzymes if persistent'
      ]
    };

    return recommendations[symptom.toLowerCase()] || [
      'Monitor the symptom and note any patterns',
      'Consult a healthcare provider if it persists',
      'Keep a symptom diary to track frequency and severity'
    ];
  }

  // ============================================
  // CONDITION ANALYSIS
  // ============================================

  /**
   * Analyze a condition and provide insights
   */
  async analyzeCondition(personId: string, conditionName: string): Promise<ConditionAnalysis> {
    const nodes = await this.getNodes(personId);
    const condition = nodes.find(n => n.type === 'CONDITION' && n.properties.name.toLowerCase() === conditionName.toLowerCase());

    // Find related symptoms
    const symptoms = nodes.filter(n => n.type === 'SYMPTOM');

    return {
      condition: conditionName,
      severity: 'moderate', // Placeholder
      relatedSymptoms: symptoms.map(s => s.properties.name),
      relatedConditions: [],
      treatmentOptions: [],
      riskFactors: [],
      lifestyleRecommendations: this.generateConditionRecommendations(conditionName)
    };
  }

  private generateConditionRecommendations(condition: string): string[] {
    const recommendations: Record<string, string[]> = {
      'diabetes': [
        'Monitor blood sugar levels regularly',
        'Maintain a balanced diet with low glycemic foods',
        'Exercise for at least 30 minutes daily',
        'Take medications as prescribed'
      ],
      'hypertension': [
        'Reduce sodium intake',
        'Regular exercise and weight management',
        'Limit alcohol consumption',
        'Monitor blood pressure at home'
      ],
      'pcod': [
        'Maintain healthy weight through diet and exercise',
        'Consider hormonal balance through nutrition',
        'Regular monitoring of menstrual cycles',
        'Consult with endocrinologist if needed'
      ],
      'thyroid': [
        'Take thyroid medication on empty stomach',
        'Regular thyroid function tests',
        'Monitor for symptoms of hypo/hyperthyroidism',
        'Avoid goitrogenic foods if recommended'
      ]
    };

    return recommendations[condition.toLowerCase()] || [
      'Follow up with your healthcare provider regularly',
      'Maintain a healthy lifestyle',
      'Monitor any changes in symptoms'
    ];
  }

  // ============================================
  // MEDICATION ANALYSIS
  // ============================================

  /**
   * Analyze a medication and find interactions
   */
  async analyzeMedication(personId: string, medicationName: string): Promise<MedicationAnalysis> {
    const nodes = await this.getNodes(personId);
    const medications = nodes.filter(n => n.type === 'MEDICATION');

    return {
      medication: medicationName,
      genericName: medicationName,
      treats: [],
      sideEffects: [],
      interactions: [],
      contraindications: []
    };
  }

  // ============================================
  // GRAPH INSIGHTS
  // ============================================

  /**
   * Generate insights from the health graph
   */
  async generateInsights(personId: string): Promise<GraphInsight[]> {
    const graph = await this.store.getGraph(personId);
    if (!graph) return [];

    const insights: GraphInsight[] = [];

    // Find symptom-condition relationships
    const symptomNodes = graph.nodes.filter(n => n.type === 'SYMPTOM');
    const conditionNodes = graph.nodes.filter(n => n.type === 'CONDITION');

    if (symptomNodes.length > 3) {
      insights.push({
        type: 'pattern',
        title: 'Multiple Symptoms Detected',
        description: `You have ${symptomNodes.length} symptoms logged. This may indicate an underlying condition that needs attention.`,
        confidence: 0.7,
        evidence: symptomNodes.map(s => s.properties.name),
        relatedNodes: symptomNodes.map(s => s.id),
        action: 'Consider scheduling an appointment with your doctor'
      });
    }

    // Check for conditions without treatment
    for (const condition of conditionNodes) {
      const treatments = graph.relationships.filter(
        r => r.type === 'TREATED_BY_MEDICATION' && r.targetNodeId === condition.id
      );

      if (treatments.length === 0) {
        insights.push({
          type: 'recommendation',
          title: 'Untreated Condition',
          description: `${condition.properties.name} is logged but no treatment is recorded.`,
          confidence: 0.9,
          evidence: [],
          relatedNodes: [condition.id],
          action: 'Consider discussing treatment options with your doctor'
        });
      }
    }

    // Medication adherence check
    const medications = graph.nodes.filter(n => n.type === 'MEDICATION');
    if (medications.length > 0) {
      insights.push({
        type: 'recommendation',
        title: 'Medication Review',
        description: `You have ${medications.length} medications on record. Regular medication reviews are important.`,
        confidence: 0.8,
        evidence: medications.map(m => m.properties.name),
        relatedNodes: medications.map(m => m.id),
        action: 'Keep track of your medications and any side effects'
      });
    }

    return insights;
  }

  // ============================================
  // CORRELATION ANALYSIS
  // ============================================

  /**
   * Find correlations between health factors
   */
  async findCorrelations(personId: string): Promise<HealthCorrelation[]> {
    const graph = await this.store.getGraph(personId);
    if (!graph) return [];

    const correlations: HealthCorrelation[] = [];

    // Find all conditions and symptoms
    const conditions = graph.nodes.filter(n => n.type === 'CONDITION');
    const symptoms = graph.nodes.filter(n => n.type === 'SYMPTOM');

    // Check for condition-symptom relationships
    for (const condition of conditions) {
      for (const symptom of symptoms) {
        const rel = graph.relationships.find(
          r => r.sourceNodeId === condition.id && r.targetNodeId === symptom.id &&
               (r.type === 'CAUSES_SYMPTOM' || r.type === 'RELATED_TO_CONDITION')
        );

        if (rel) {
          correlations.push({
            nodeA: condition.properties.name,
            nodeB: symptom.properties.name,
            correlationType: 'positive',
            strength: rel.properties.weight,
            evidence: rel.properties.evidence,
            description: `${condition.properties.name} is often associated with ${symptom.properties.name}`
          });
        }
      }
    }

    return correlations;
  }

  // ============================================
  // NEIGHBORHOOD QUERY
  // ============================================

  /**
   * Get all nodes connected to a specific node
   */
  async getNeighborhood(personId: string, nodeId: string, depth: number = 1): Promise<{
    nodes: GraphNode[];
    relationships: GraphRelationship[];
  }> {
    const graph = await this.store.getGraph(personId);
    if (!graph) return { nodes: [], relationships: [] };

    const visited = new Set<string>();
    const resultNodes: GraphNode[] = [];
    const resultRelationships: GraphRelationship[] = [];

    const queue: { nodeId: string; currentDepth: number }[] = [{ nodeId, currentDepth: 0 }];

    while (queue.length > 0) {
      const { nodeId: currentNodeId, currentDepth } = queue.shift()!;

      if (visited.has(currentNodeId) || currentDepth > depth) continue;
      visited.add(currentNodeId);

      // Find the node
      const node = graph.nodes.find(n => n.id === currentNodeId);
      if (node && currentDepth > 0) {
        resultNodes.push(node);
      }

      // Find connected relationships
      const relationships = graph.relationships.filter(
        r => r.sourceNodeId === currentNodeId || r.targetNodeId === currentNodeId
      );

      for (const rel of relationships) {
        if (!resultRelationships.find(r => r.id === rel.id)) {
          resultRelationships.push(rel);
        }

        const nextNodeId = rel.sourceNodeId === currentNodeId ? rel.targetNodeId : rel.sourceNodeId;
        if (!visited.has(nextNodeId) && currentDepth < depth) {
          queue.push({ nodeId: nextNodeId, currentDepth: currentDepth + 1 });
        }
      }
    }

    return { nodes: resultNodes, relationships: resultRelationships };
  }

  // ============================================
  // GRAPH EXPORT
  // ============================================

  /**
   * Export graph for AI processing
   */
  async exportGraph(personId: string): Promise<{
    nodes: Array<{ type: string; name: string; properties: any }>;
    relationships: Array<{ type: string; source: string; target: string }>;
  }> {
    const graph = await this.store.getGraph(personId);
    if (!graph) return { nodes: [], relationships: [] };

    return {
      nodes: graph.nodes.map(n => ({
        type: n.type,
        name: n.properties.name,
        properties: n.properties
      })),
      relationships: graph.relationships.map(r => ({
        type: r.type,
        source: r.sourceNodeId,
        target: r.targetNodeId
      }))
    };
  }
}

export const healthGraphService = new HealthGraphService();