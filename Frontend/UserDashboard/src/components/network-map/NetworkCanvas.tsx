import { useRef, useEffect, useState } from "react";
import { NetworkNode, NetworkLink, LINK_COLORS, NODE_COLORS } from "@/types/networkTopology";
import { Router, Network, Server, Box, Wifi, Radio, Monitor } from "lucide-react";

interface NetworkCanvasProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onNodeClick?: (node: NetworkNode) => void;
  onNodeDragEnd?: (nodeId: string, x: number, y: number) => void;
  selectedNodeId?: string;
}

const NetworkCanvas = ({ nodes, links, onNodeClick, onNodeDragEnd, selectedNodeId }: NetworkCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'router': return Router;
      case 'switch': return Network;
      case 'olt': return Server;
      case 'ont': return Box;
      case 'ap': return Wifi;
      case 'repeater': return Radio;
      case 'client': return Monitor;
      default: return Network;
    }
  };

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links first (so they appear behind nodes)
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source_node_id);
      const targetNode = nodes.find(n => n.id === link.target_node_id);

      if (!sourceNode || !targetNode) return;

      // Determine link color based on status
      const color = LINK_COLORS[link.status] || LINK_COLORS.unknown;

      ctx.beginPath();
      ctx.moveTo(sourceNode.position_x, sourceNode.position_y);
      ctx.lineTo(targetNode.position_x, targetNode.position_y);
      ctx.strokeStyle = color;
      ctx.lineWidth = link.width || 2;

      // Set line style
      if (link.style === 'dashed') {
        ctx.setLineDash([5, 5]);
      } else if (link.style === 'dotted') {
        ctx.setLineDash([2, 3]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.stroke();
      ctx.setLineDash([]);

      // Draw link label (bandwidth/latency)
      if (link.bandwidth || link.latency_ms) {
        const midX = (sourceNode.position_x + targetNode.position_x) / 2;
        const midY = (sourceNode.position_y + targetNode.position_y) / 2;
        
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        
        const label = link.bandwidth || `${link.latency_ms}ms`;
        ctx.fillText(label, midX, midY - 5);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = node.id === selectedNodeId;
      const color = NODE_COLORS[node.status] || NODE_COLORS.unknown;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.position_x, node.position_y, isSelected ? 25 : 20, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw node label
      ctx.fillStyle = '#333';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.position_x, node.position_y + 35);

      // Draw node type
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.fillText(node.type, node.position_x, node.position_y + 48);
    });
  };

  useEffect(() => {
    drawNetwork();
  }, [nodes, links, selectedNodeId]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = x - node.position_x;
      const dy = y - node.position_y;
      return Math.sqrt(dx * dx + dy * dy) <= 20;
    });

    if (clickedNode) {
      setDraggingNode(clickedNode.id);
      setDragOffset({
        x: x - clickedNode.position_x,
        y: y - clickedNode.position_y,
      });
      
      if (onNodeClick) {
        onNodeClick(clickedNode);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Update node position temporarily for visual feedback
    const nodeIndex = nodes.findIndex(n => n.id === draggingNode);
    if (nodeIndex !== -1) {
      nodes[nodeIndex].position_x = x;
      nodes[nodeIndex].position_y = y;
      drawNetwork();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    if (onNodeDragEnd) {
      onNodeDragEnd(draggingNode, x, y);
    }

    setDraggingNode(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      className="border border-border rounded-lg bg-background cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default NetworkCanvas;
