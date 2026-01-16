import { NetworkNode } from "@/types/networkTopology";
import { CableType } from "./CableTypeSelector";

interface LinkCreationPreviewProps {
  sourceNode: NetworkNode | null;
  targetNode: NetworkNode | null;
  mousePosition: { x: number; y: number } | null;
  cableType: CableType;
  pan: { x: number; y: number };
  zoom: number;
}

const LinkCreationPreview = ({
  sourceNode,
  targetNode,
  mousePosition,
  cableType,
  pan,
  zoom
}: LinkCreationPreviewProps) => {
  if (!sourceNode) return null;

  const canvasToScreen = (canvasX: number, canvasY: number) => {
    return {
      x: canvasX * zoom + pan.x,
      y: canvasY * zoom + pan.y,
    };
  };

  const sourceScreen = canvasToScreen(sourceNode.position_x, sourceNode.position_y);
  const targetScreen = targetNode 
    ? canvasToScreen(targetNode.position_x, targetNode.position_y)
    : mousePosition || sourceScreen;

  // Cable type styling
  const getCableStyle = () => {
    switch (cableType) {
      case 'utp':
        return {
          stroke: '#3b82f6',
          strokeWidth: 3,
          strokeDasharray: 'none'
        };
      case 'fiber':
        return {
          stroke: '#f97316',
          strokeWidth: 4,
          strokeDasharray: 'none'
        };
      case 'wireless':
        return {
          stroke: '#22c55e',
          strokeWidth: 3,
          strokeDasharray: '10,5'
        };
    }
  };

  const style = getCableStyle();

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1000 }}
    >
      {/* Preview line */}
      <line
        x1={sourceScreen.x}
        y1={sourceScreen.y}
        x2={targetScreen.x}
        y2={targetScreen.y}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray}
        opacity={0.6}
      />
      
      {/* Source indicator */}
      <circle
        cx={sourceScreen.x}
        cy={sourceScreen.y}
        r={8}
        fill={style.stroke}
        opacity={0.8}
      />
      
      {/* Target indicator (if hovering over node) */}
      {targetNode && (
        <circle
          cx={targetScreen.x}
          cy={targetScreen.y}
          r={8}
          fill={style.stroke}
          opacity={0.8}
        />
      )}
      
      {/* Cable type label */}
      <text
        x={(sourceScreen.x + targetScreen.x) / 2}
        y={(sourceScreen.y + targetScreen.y) / 2 - 10}
        fill={style.stroke}
        fontSize="12"
        fontWeight="bold"
        textAnchor="middle"
        className="pointer-events-none"
      >
        {cableType.toUpperCase()}
      </text>
    </svg>
  );
};

export default LinkCreationPreview;
