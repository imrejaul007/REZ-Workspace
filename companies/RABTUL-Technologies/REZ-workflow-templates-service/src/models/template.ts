export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: string;
  industry: string;
  tags: string[];
  estimatedTime: string;
  difficulty: string;
  popularity?: number;
  uses?: number;
  rating?: number;
  reviews?: number;
  prerequisites?: string[];
  integrations?: string[];
  pricing?: string;
  nodes: TemplateNode[];
  edges: TemplateEdge[];
  trigger?: {
    type: string;
    config: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TemplateNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    config?: Record<string, any>;
  };
}

export interface TemplateEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}
