import { NetworkNode, NetworkLink } from "@/types/networkTopology";
import NetworkCanvas from "./NetworkCanvas";

interface TreeViewProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onNodeClick?: (node: NetworkNode) => void;
  onNodeDragEnd?: (nodeId: string, x: number, y: number) => void;
  selectedNodeId?: string;
}

const TreeView = ({ nodes, links, onNodeClick, onNodeDragEnd, selectedNodeId }: TreeViewProps) => {
  // Auto-arrange nodes in tree layout
  const arrangeTreeLayout = () => {
    const arranged = [...nodes];
    const levels: { [key: number]: NetworkNode[] } = {};

    // Group nodes by level
    arranged.forEach(node => {
      if (!levels[node.level]) {
        levels[node.level] = [];
      }
      levels[node.level].push(node);
    });

    // Calculate positions
    const levelHeight = 150;
    const startY = 80;

    Object.keys(levels).forEach(levelKey => {
      const level = parseInt(levelKey);
      const nodesInLevel = levels[level];
      const levelWidth = 1200;
      const spacing = levelWidth / (nodesInLevel.length + 1);

      nodesInLevel.forEach((node, index) => {
        node.position_x = spacing * (index + 1);
        node.position_y = startY + (level * levelHeight);
      });
    });

    return arranged;
  };

  const arrangedNodes = arrangeTreeLayout();

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

export default TreeView;
