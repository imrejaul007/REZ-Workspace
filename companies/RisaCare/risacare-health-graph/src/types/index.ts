/**
 * Health Knowledge Graph - Types
 *
 * Graph relationships for health intelligence
 * Following RTNM Doctrine: Memory → Knowledge Graph → Twin → Intelligence
 */

import { z } from 'zod';

// ============================================
// GRAPH NODE TYPES
// ============================================

export const GraphNodeTypeSchema = z.enum([
  'PERSON',
  'CONDITION',
  'SYMPTOM',
  'MEDICATION',
  'DOCTOR',
  'FACILITY',
  'LAB',
  'PHARMACY',
  'ALLERGY',
  'VACCINATION',
  'PROCEDURE',
  'LIFE_EVENT',
  'FAMILY_MEMBER',
  'INSURANCE',
  'BLOOD_TYPE',
  'BODY_AREA',
  'SEVERITY',
  'MEDICAL_TERM'
]);

export type GraphNodeType = z.infer<typeof GraphNodeTypeSchema>;

// ============================================
// GRAPH RELATIONSHIP TYPES
// ============================================

export const GraphRelationshipTypeSchema = z.enum([
  // Person relationships
  'HAS_CONDITION',
  'EXPERIENCES_SYMPTOM',
  'TAKES_MEDICATION',
  'VISITS_DOCTOR',
  'ALLERGIC_TO',
  'UNDERWENT_PROCEDURE',
  'HAS_FAMILY_MEMBER',
  'INSURED_BY',
  'EXPERIENCED_LIFE_EVENT',
  'VACCINATED_WITH',
  'HAS_ALLERGY',

  // Condition relationships
  'CAUSES_SYMPTOM',
  'TREATED_BY_MEDICATION',
  'DIAGNOSED_BY_DOCTOR',
  'RELATED_TO_CONDITION',
  'COMPLICATION_OF',

  // Medication relationships
  'TREATS_CONDITION',
  'CAUSES_SIDE_EFFECT',
  'INTERACTS_WITH',
  'PRESCRIBED_BY_DOCTOR',
  'HAS_GENERIC',

  // Symptom relationships
  'MANIFESTS_AS',
  'TRIGGERED_BY',
  'RELIEVED_BY',
  'ASSOCIATED_WITH_CONDITION',

  // Doctor relationships
  'SPECIALIZES_IN',
  'WORKS_AT_FACILITY',
  'PERFORMED_PROCEDURE',

  // Family relationships
  'IS_MOTHER_OF',
  'IS_FATHER_OF',
  'IS_CHILD_OF',
  'IS_SPOUSE_OF',
  'IS_SIBLING_OF',
  'CARES_FOR',

  // Life event relationships
  'AFFECTS_HEALTH',
  'TRIGGERS_CONDITION',
  'REQUIRES_MEDICATION'
]);

export type GraphRelationshipType = z.infer<typeof GraphRelationshipTypeSchema>;

// ============================================
// GRAPH NODE
// ============================================

export const GraphNodeSchema = z.object({
  id: z.string(),
  type: GraphNodeTypeSchema,
  properties: z.object({
    name: z.string(),
    description: z.string().optional(),
    value: z.any().optional(),
    metadata: z.record(z.any()).default({})
  }),
  source: z.enum(['user_input', 'medical_report', 'ai_extracted', 'life_event']).default('user_input'),
  confidence: z.number().min(0).max(1).default(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;

// ============================================
// GRAPH RELATIONSHIP
// ============================================

export const GraphRelationshipSchema = z.object({
  id: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  type: GraphRelationshipTypeSchema,
  properties: z.object({
    weight: z.number().min(0).max(1).default(0.5),
    description: z.string().optional(),
    evidence: z.array(z.string()).default([]),
    metadata: z.record(z.any()).default({})
  }),
  source: z.enum(['user_input', 'medical_report', 'ai_extracted', 'life_event']).default('user_input'),
  confidence: z.number().min(0).max(1).default(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type GraphRelationship = z.infer<typeof GraphRelationshipSchema>;

// ============================================
// HEALTH KNOWLEDGE GRAPH
// ============================================

export const HealthKnowledgeGraphSchema = z.object({
  personId: z.string().uuid(),
  nodes: z.array(GraphNodeSchema).default([]),
  relationships: z.array(GraphRelationshipSchema).default([]),
  metadata: z.object({
    totalNodes: z.number().default(0),
    totalRelationships: z.number().default(0),
    lastUpdated: z.string(),
    confidence: z.number().min(0).max(1).default(0)
  }).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type HealthKnowledgeGraph = z.infer<typeof HealthKnowledgeGraphSchema>;

// ============================================
// KNOWLEDGE EXTRACTION
// ============================================

export const KnowledgeExtractionInputSchema = z.object({
  text: z.string(),
  source: z.enum(['medical_report', 'doctor_notes', 'prescription', 'article', 'user_input']).default('user_input'),
  metadata: z.record(z.any()).default({})
});

export type KnowledgeExtractionInput = z.infer<typeof KnowledgeExtractionInputSchema>;

// ============================================
// SYMPTOM ANALYSIS
// ============================================

export const SymptomAnalysisSchema = z.object({
  symptom: z.string(),
  possibleCauses: z.array(z.object({
    condition: z.string(),
    probability: z.number().min(0).max(1),
    supportingEvidence: z.array(z.string()).default([]),
    relatedSymptoms: z.array(z.string()).default([])
  })).default([]),
  relatedMedications: z.array(z.object({
    medication: z.string(),
    effect: z.enum(['treats', 'causes', 'interacts']),
    relevance: z.number().min(0).max(1)
  })).default([]),
  recommendations: z.array(z.string()).default([])
});

export type SymptomAnalysis = z.infer<typeof SymptomAnalysisSchema>;

// ============================================
// CONDITION ANALYSIS
// ============================================

export const ConditionAnalysisSchema = z.object({
  condition: z.string(),
  icdCode: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']),
  relatedSymptoms: z.array(z.string()).default([]),
  relatedConditions: z.array(z.string()).default([]),
  treatmentOptions: z.array(z.object({
    medication: z.string(),
    type: z.enum(['primary', 'secondary', 'supportive']),
    effectiveness: z.number().min(0).max(1)
  })).default([]),
  riskFactors: z.array(z.string()).default([]),
  lifestyleRecommendations: z.array(z.string()).default([])
});

export type ConditionAnalysis = z.infer<typeof ConditionAnalysisSchema>;

// ============================================
// MEDICATION ANALYSIS
// ============================================

export const MedicationAnalysisSchema = z.object({
  medication: z.string(),
  genericName: z.string().optional(),
  treats: z.array(z.string()).default([]),
  sideEffects: z.array(z.object({
    symptom: z.string(),
    frequency: z.enum(['common', 'occasional', 'rare']),
    severity: z.enum(['mild', 'moderate', 'severe'])
  })).default([]),
  interactions: z.array(z.object({
    medication: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe']),
    description: z.string()
  })).default([]),
  contraindications: z.array(z.string()).default([])
});

export type MedicationAnalysis = z.infer<typeof MedicationAnalysisSchema>;

// ============================================
// GRAPH QUERY TYPES
// ============================================

export interface GraphQuery {
  personId: string;
  nodeTypes?: GraphNodeType[];
  relationshipTypes?: GraphRelationshipType[];
  depth?: number;
  startNodeId?: string;
}

export interface PathQuery {
  personId: string;
  fromNodeId: string;
  toNodeId: string;
  maxDepth?: number;
}

export interface NeighborhoodQuery {
  personId: string;
  nodeId: string;
  depth?: number;
  relationshipTypes?: GraphRelationshipType[];
}

// ============================================
// GRAPH INSIGHTS
// ============================================

export interface GraphInsight {
  type: 'correlation' | 'causation' | 'pattern' | 'risk' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  evidence: string[];
  relatedNodes: string[];
  action?: string;
}

export interface HealthCorrelation {
  nodeA: string;
  nodeB: string;
  correlationType: 'positive' | 'negative' | 'none';
  strength: number;
  evidence: string[];
  description: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface GraphResponse {
  success: boolean;
  graph?: HealthKnowledgeGraph;
  nodes?: GraphNode[];
  relationships?: GraphRelationship[];
  insights?: GraphInsight[];
  error?: string;
  timestamp: string;
}