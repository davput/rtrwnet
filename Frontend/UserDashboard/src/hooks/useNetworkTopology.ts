import { useState, useEffect, useCallback } from "react";
import { NetworkNode, NetworkLink } from "@/types/networkTopology";

// Mock data for network topology
const mockNodes: NetworkNode[] = [];
const mockLinks: NetworkLink[] = [];

export const useNetworkTopology = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setNodes(mockNodes);
      setLinks(mockLinks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load network topology'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateNodePosition = useCallback(async (nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position_x: x, position_y: y } : node
    ));
  }, []);

  const createNode = useCallback(async (nodeData: Partial<NetworkNode>) => {
    const newNode: NetworkNode = {
      id: `node-${Date.now()}`,
      name: nodeData.name || "New Device",
      type: nodeData.type || "router",
      status: nodeData.status || "unknown",
      position_x: nodeData.position_x || 0,
      position_y: nodeData.position_y || 0,
      level: nodeData.level || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...nodeData,
    } as NetworkNode;
    
    setNodes(prev => [...prev, newNode]);
    return newNode;
  }, []);

  const createLink = useCallback(async (linkData: Partial<NetworkLink>) => {
    const newLink: NetworkLink = {
      id: `link-${Date.now()}`,
      source_node_id: linkData.source_node_id!,
      target_node_id: linkData.target_node_id!,
      link_type: linkData.link_type || "utp",
      status: linkData.status || "connected",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...linkData,
    } as NetworkLink;
    
    setLinks(prev => [...prev, newLink]);
    return newLink;
  }, []);

  const deleteNode = useCallback(async (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setLinks(prev => prev.filter(link => 
      link.source_node_id !== nodeId && link.target_node_id !== nodeId
    ));
  }, []);

  const deleteLink = useCallback(async (linkId: string) => {
    setLinks(prev => prev.filter(link => link.id !== linkId));
  }, []);

  return {
    nodes,
    links,
    loading,
    error,
    loadData,
    updateNodePosition,
    createNode,
    createLink,
    deleteNode,
    deleteLink,
  };
};
