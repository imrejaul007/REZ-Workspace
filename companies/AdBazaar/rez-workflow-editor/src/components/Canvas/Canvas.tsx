'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useReactFlow,
  ReactFlowInstance,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '@/store/workflowStore';
import { WorkflowNodeType } from '@/types/workflow';
import WorkflowNodeComponent from './WorkflowNode';
import ConditionalEdge from './ConditionalEdge';

const nodeTypes = {
  workflowNode: WorkflowNodeComponent,
};

const edgeTypes = {
  conditional: ConditionalEdge,
};

const defaultEdgeOptions = {
  animated: false,
  type: 'smoothstep',
  style: { stroke: '#6366f1', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6366f1',
  },
};

interface CanvasProps {
  onNodeSelect?: (nodeId: string | null) => void;
}

const Canvas: React.FC<CanvasProps> = ({ onNodeSelect }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const {
    currentWorkflow,
    selectedNodeId,
    addNode,
    updateNodePosition,
    removeNode,
    addEdge: storeAddEdge,
    removeEdge,
    selectNode,
    clearSelection,
    zoom,
    setZoom,
  } = useWorkflowStore();

  const nodes = currentWorkflow?.nodes || [];
  const edges = currentWorkflow?.edges || [];

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        storeAddEdge(
          params.source,
          params.target,
          params.sourceHandle || undefined,
          params.targetHandle || undefined
        );
      }
    },
    [storeAddEdge]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && change.id) {
          updateNodePosition(change.id, change.position);
        }
        if (change.type === 'remove' && change.id) {
          removeNode(change.id);
        }
      });
    },
    [updateNodePosition, removeNode]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove' && change.id) {
          removeEdge(change.id);
        }
      });
    },
    [removeEdge]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
      onNodeSelect?.(node.id);
    },
    [selectNode, onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
    onNodeSelect?.(null);
  }, [clearSelection, onNodeSelect]);

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      useWorkflowStore.getState().selectEdge(edge.id);
    },
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType;
      if (!type || !reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addNode(type, position);
    },
    [reactFlowInstance, addNode]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  // Transform nodes for ReactFlow
  const flowNodes: Node[] = nodes.map((node) => ({
    id: node.id,
    type: 'workflowNode',
    position: node.position,
    data: {
      ...node.data,
      selected: node.id === selectedNodeId,
    },
    selected: node.id === selectedNodeId,
    draggable: true,
  }));

  // Transform edges for ReactFlow
  const flowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label,
    type: edge.type || 'smoothstep',
    animated: edge.animated,
    style: edge.style,
    data: edge.label ? { label: edge.label } : undefined,
  }));

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        onInit={onInit}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.25}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          position="bottom-left"
        />
        <MiniMap
          nodeColor={(node) => {
            const colors: Record<WorkflowNodeType, string> = {
              trigger: '#22c55e',
              action: '#3b82f6',
              condition: '#a855f7',
              ai_agent: '#ec4899',
              delay: '#f97316',
              webhook: '#06b6d4',
              filter: '#eab308',
              transform: '#6366f1',
            };
            return colors[node.type as WorkflowNodeType] || '#6366f1';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-right"
          style={{
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            border: '1px solid #374151',
          }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#374151"
        />
      </ReactFlow>
    </div>
  );
};

const CanvasWithProvider: React.FC<CanvasProps> = (props) => (
  <ReactFlowProvider>
    <Canvas {...props} />
  </ReactFlowProvider>
);

export default CanvasWithProvider;