import { NetworkNode, NetworkLink } from "@/types/networkTopology";
import NetworkCanvas from "./NetworkCanvas";

interface GridViewProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onNodeClick?: (node: NetworkNode) => void;
  onNodeDragEnd?: (nodeId: string, x: number, y: number) => void;
  selectedNodeId?: string;
}

const GridView = ({ nodes, links, onNodeClick, onNodeDragEnd, selectedNodeId }: GridViewProps) => {
  // Auto-arrange nodes in grid layout
  const arrangeGridLayout = () => {
    const arranged = [...nodes];
    const cols = Math.ceil(Math.sqrt(arranged.length));
    const cellWidth = 1200 / cols;
    const cellHeight = 800 / Math.ceil(arranged.length / cols);

    arranged.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      node.position_x = (col * cellWidth) + (cellWidth / 2);
      node.position_y = (row * cellHeight) + (cellHeight / 2);
    });

    return arranged;
  };

  const arrangedNodes = arrangeGridLayout();

  return (
    <div className="w-full h-full overflow-auto">
      <NetworkCanvas
        nodes={arrangedNodes}
        links={links}
        onNodeClick={onNodeClick}
        onNodeDragEnd={onNodeDragEnd}
        selectedNodeId={selectedNodeId}
      />
    </div>
  );
};

export default GridView;
