import { useState } from 'react';
import ReactFlow, { 
  Node, 
  Edge,
  Controls,
  Background,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

interface WorkflowBuilderProps {
  steps: any[];
  onStepsChange: (steps: any[]) => void;
}

const WorkflowBuilder = ({ steps, onStepsChange }: WorkflowBuilderProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Convert steps to nodes and edges
  const initializeFlow = () => {
    const newNodes: Node[] = steps.map((step, index) => ({
      id: step.id,
      type: 'default',
      data: { 
        label: (
          <div className="p-2">
            <div className="text-xs font-medium text-pastel-dusty">{step.role}</div>
            <div className="text-xs text-pastel-gray">{step.description}</div>
          </div>
        )
      },
      position: { x: 100, y: index * 100 },
      className: 'bg-white border border-pastel-pink border-opacity-20 rounded-lg shadow-sm'
    }));

    const newEdges: Edge[] = [];
    for (let i = 0; i < steps.length - 1; i++) {
      newEdges.push({
        id: `e${i}-${i + 1}`,
        source: steps[i].id,
        target: steps[i + 1].id,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#B5838D',
        },
        style: { stroke: '#B5838D' }
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  };

  // Initialize flow when steps change
  useState(() => {
    if (steps.length > 0) {
      initializeFlow();
    }
  });

  return (
    <div>
      <h3 className="text-sm font-medium text-pastel-gray mb-3">Workflow Preview</h3>
      <div className="h-[300px] border border-pastel-pink border-opacity-20 rounded-lg bg-pastel-peach bg-opacity-5">
        {steps.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-pastel-gray">
            Select a workflow template to preview
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;