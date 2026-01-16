import { useState, useEffect, useCallback } from "react";
import { NetworkNode, NetworkLink, TextLabel } from "@/types/networkTopology";
import { useNetworkTopology } from "./useNetworkTopology";

const STORAGE_KEY = "network-topology-draft";

interface TopologyDraft {
  nodes: NetworkNode[];
  links: NetworkLink[];
  labels: TextLabel[];
  lastModified: string;
}

export const useNetworkTopologyLocal = () => {
  const {
    nodes: dbNodes,
    links: dbLinks,
    loading,
    loadData,
    updateNodePosition: dbUpdateNodePosition,
    createNode: dbCreateNode,
    createLink: dbCreateLink,
  } = useNetworkTopology();

  const [localNodes, setLocalNodes] = useState<NetworkNode[]>([]);
  const [localLinks, setLocalLinks] = useState<NetworkLink[]>([]);
  const [localLabels, setLocalLabels] = useState<TextLabel[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const draft: TopologyDraft = JSON.parse(stored);
        setLocalNodes(draft.nodes);
        setLocalLinks(draft.links);
        setLocalLabels(draft.labels || []);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error("Failed to load draft from localStorage:", error);
      }
    }
  }, []);

  // Initialize local state from database
  useEffect(() => {
    if (!hasUnsavedChanges && dbNodes.length > 0) {
      setLocalNodes(dbNodes);
      setLocalLinks(dbLinks);
    }
  }, [dbNodes, dbLinks, hasUnsavedChanges]);

  // Save to localStorage whenever local state changes
  const saveToLocalStorage = useCallback(() => {
    const draft: TopologyDraft = {
      nodes: localNodes,
      links: localLinks,
      labels: localLabels,
      lastModified: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [localNodes, localLinks, localLabels]);

  // Update node position (local only)
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setLocalNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? { ...node, position_x: x, position_y: y }
          : node
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  // Update node name (local only)
  const updateNodeName = useCallback((nodeId: string, name: string) => {
    setLocalNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId ? { ...node, name } : node
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  // Create node (local only)
  const createNode = useCallback((nodeData: Partial<NetworkNode>) => {
    const newNode: NetworkNode = {
      id: `temp-${Date.now()}`,
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

    setLocalNodes((prev) => [...prev, newNode]);
    setHasUnsavedChanges(true);
    return newNode;
  }, []);

  // Create link (local only)
  const createLink = useCallback((linkData: Partial<NetworkLink>) => {
    const newLink: NetworkLink = {
      id: `temp-${Date.now()}`,
      source_node_id: linkData.source_node_id!,
      target_node_id: linkData.target_node_id!,
      link_type: linkData.link_type || "utp",
      status: linkData.status || "connected",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...linkData,
    } as NetworkLink;

    setLocalLinks((prev) => [...prev, newLink]);
    setHasUnsavedChanges(true);
    return newLink;
  }, []);

  // Delete node (local only)
  const deleteNode = useCallback((nodeId: string) => {
    setLocalNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setLocalLinks((prev) =>
      prev.filter(
        (link) =>
          link.source_node_id !== nodeId && link.target_node_id !== nodeId
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  // Delete link (local only)
  const deleteLink = useCallback((linkId: string) => {
    setLocalLinks((prev) => prev.filter((link) => link.id !== linkId));
    setHasUnsavedChanges(true);
  }, []);

  // Create text label (local only)
  const createLabel = useCallback((x: number, y: number, text: string = "New Label") => {
    const newLabel: TextLabel = {
      id: `temp-label-${Date.now()}`,
      text,
      position_x: x,
      position_y: y,
      font_size: 14,
      color: "#2c3e50",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLocalLabels((prev) => [...prev, newLabel]);
    setHasUnsavedChanges(true);
    return newLabel;
  }, []);

  // Update label text (local only)
  const updateLabelText = useCallback((labelId: string, text: string) => {
    setLocalLabels((prev) =>
      prev.map((label) =>
        label.id === labelId ? { ...label, text, updated_at: new Date().toISOString() } : label
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  // Update label position (local only)
  const updateLabelPosition = useCallback((labelId: string, x: number, y: number) => {
    setLocalLabels((prev) =>
      prev.map((label) =>
        label.id === labelId
          ? { ...label, position_x: x, position_y: y, updated_at: new Date().toISOString() }
          : label
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  // Update label style (local only)
  const updateLabelStyle = useCallback((
    labelId: string,
    fontSize?: number,
    color?: string,
    backgroundColor?: string
  ) => {
    setLocalLabels((prev) =>
      prev.map((label) =>
        label.id === labelId
          ? {
              ...label,
              ...(fontSize !== undefined && { font_size: fontSize }),
              ...(color !== undefined && { color }),
              ...(backgroundColor !== undefined && { background_color: backgroundColor }),
              updated_at: new Date().toISOString(),
            }
          : label
      )
    );
    setHasUnsavedChanges(true);
  }, []);

  // Delete label (local only)
  const deleteLabel = useCallback((labelId: string) => {
    setLocalLabels((prev) => prev.filter((label) => label.id !== labelId));
    setHasUnsavedChanges(true);
  }, []);

  // Save all changes to database
  const saveToDatabase = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save nodes
      for (const node of localNodes) {
        if (node.id.startsWith("temp-")) {
          // Create new node
          await dbCreateNode(node);
        } else {
          // Update existing node
          await dbUpdateNodePosition(node.id, node.position_x, node.position_y);
        }
      }

      // Save links
      for (const link of localLinks) {
        if (link.id.startsWith("temp-")) {
          // Create new link
          await dbCreateLink(link);
        }
      }

      // TODO: Save labels to database when migration is ready
      // For now, labels are only stored in localStorage

      // Reload from database
      await loadData();

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
      setHasUnsavedChanges(false);

      return { success: true };
    } catch (error) {
      console.error("Failed to save to database:", error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  }, [localNodes, localLinks, dbCreateNode, dbCreateLink, dbUpdateNodePosition, loadData]);

  // Discard changes and reload from database
  const discardChanges = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLocalNodes(dbNodes);
    setLocalLinks(dbLinks);
    setLocalLabels([]);
    setHasUnsavedChanges(false);
  }, [dbNodes, dbLinks]);

  // Auto-save to localStorage
  useEffect(() => {
    if (hasUnsavedChanges) {
      saveToLocalStorage();
    }
  }, [hasUnsavedChanges, saveToLocalStorage]);

  return {
    nodes: localNodes,
    links: localLinks,
    labels: localLabels,
    loading,
    hasUnsavedChanges,
    isSaving,
    updateNodePosition,
    updateNodeName,
    createNode,
    createLink,
    deleteNode,
    deleteLink,
    createLabel,
    updateLabelText,
    updateLabelPosition,
    updateLabelStyle,
    deleteLabel,
    saveToDatabase,
    discardChanges,
    loadData,
  };
};
