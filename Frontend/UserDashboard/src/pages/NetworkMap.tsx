import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Network as NetworkIcon, 
  Grid3x3, 
  Map as MapIcon
} from "lucide-react";
import { useNetworkTopology } from "@/hooks/useNetworkTopology";
import { useToast } from "@/hooks/use-toast";
import TreeView from "@/components/network-map/TreeView";
import GridView from "@/components/network-map/GridView";
import GeographicalView from "@/components/network-map/GeographicalView";
import InteractiveCanvas from "@/components/network-map/InteractiveCanvasWithToolbar";
import NodeDetailsPanel from "@/components/network-map/NodeDetailsPanel";
import LinkDetailsPanel from "@/components/network-map/LinkDetailsPanel";
import AddNodeDialog from "@/components/network-map/AddNodeDialog";
import DevicePalette from "@/components/network-map/DevicePalette";
import { NetworkNode, NetworkLink } from "@/types/networkTopology";

const NetworkMap = () => {
  const { toast } = useToast();
  const {
    nodes,
    links,
    loading,
    loadData,
    updateNodePosition,
    createNode,
    createLink,
    deleteNode,
    deleteLink,
  } = useNetworkTopology();

  const canvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'interactive' | 'tree' | 'grid' | 'geographical'>('interactive');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);

  const handleNodeClick = (node: NetworkNode) => {
    // Single click - only select/highlight, don't show panel
    setSelectedNode(node);
    setSelectedLink(null);
    setShowNodeDetails(false); // Hide panel on single click
  };

  const handleNodeDoubleClick = (node: NetworkNode) => {
    // Double click - show the floating detail panel
    setSelectedNode(node);
    setSelectedLink(null);
    setShowNodeDetails(true); // Show panel on double click
  };

  const handleCanvasClick = () => {
    // Click on empty area - deselect everything
    setSelectedNode(null);
    setSelectedLink(null);
    setShowNodeDetails(false);
  };

  const handleLinkClick = (link: NetworkLink) => {
    setSelectedLink(link);
    setSelectedNode(null);
  };

  const handleNodeDragEnd = async (nodeId: string, x: number, y: number) => {
    await updateNodePosition(nodeId, x, y);
  };

  const handleDeleteNode = async (node: NetworkNode) => {
    if (confirm(`Hapus node "${node.name}"?`)) {
      await deleteNode(node.id);
      setSelectedNode(null);
    }
  };

  const handleDeleteLink = async (link: NetworkLink) => {
    if (confirm(`Hapus link "${link.name || 'ini'}"?`)) {
      await deleteLink(link.id);
      setSelectedLink(null);
    }
  };

  const handleAddNode = async (nodeData: Partial<NetworkNode>) => {
    await createNode(nodeData);
    loadData(); // Refresh to show new node
  };

  // Handle link creation (legacy - without ports)
  const handleLinkCreate = async (sourceId: string, targetId: string, cableType: string) => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    
    if (!sourceNode || !targetNode) return;

    // Determine link type based on cable type
    const linkTypeMap: Record<string, 'fiber' | 'utp' | 'wireless' | 'virtual'> = {
      'utp': 'utp',
      'fiber': 'fiber',
      'wireless': 'wireless'
    };

    // Calculate initial bandwidth based on cable type
    const bandwidthMap: Record<string, string> = {
      'utp': '1 Gbps',
      'fiber': '10 Gbps',
      'wireless': '300 Mbps'
    };

    // Create link with auto-generated name
    const linkData: Partial<NetworkLink> = {
      source_node_id: sourceId,
      target_node_id: targetId,
      name: `${sourceNode.name} <-> ${targetNode.name}`,
      link_type: linkTypeMap[cableType] || 'utp',
      bandwidth: bandwidthMap[cableType],
      status: 'connected', // Start as connected
      latency_ms: cableType === 'fiber' ? 1 : cableType === 'utp' ? 5 : 15,
    };

    await createLink(linkData);
    
    toast({
      title: "Link Created!",
      description: `${sourceNode.name} connected to ${targetNode.name} via ${cableType.toUpperCase()}`,
    });
    
    loadData(); // Refresh to show new link
  };

  // Handle link creation with port selection
  const handleLinkCreateWithPorts = async (
    sourceId: string,
    targetId: string,
    sourcePort: string,
    targetPort: string,
    cableType: string
  ) => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    
    if (!sourceNode || !targetNode) return;

    // Determine link type based on cable type
    const linkTypeMap: Record<string, 'fiber' | 'utp' | 'wireless' | 'virtual'> = {
      'utp': 'utp',
      'fiber': 'fiber',
      'wireless': 'wireless'
    };

    // Calculate bandwidth based on cable type
    const bandwidthMap: Record<string, string> = {
      'utp': '1 Gbps',
      'fiber': '10 Gbps',
      'wireless': '300 Mbps'
    };

    // Create link with port information
    const linkData: Partial<NetworkLink> = {
      source_node_id: sourceId,
      target_node_id: targetId,
      source_port: sourcePort,
      target_port: targetPort,
      name: `${sourceNode.name}[${sourcePort}] ↔ ${targetNode.name}[${targetPort}]`,
      link_type: linkTypeMap[cableType] || 'utp',
      bandwidth: bandwidthMap[cableType],
      status: 'connected',
      latency_ms: cableType === 'fiber' ? 1 : cableType === 'utp' ? 5 : 15,
    };

    await createLink(linkData);
    
    toast({
      title: "Cable Connected!",
      description: `${sourceNode.name}[${sourcePort}] ↔ ${targetNode.name}[${targetPort}]`,
    });
    
    loadData(); // Refresh to show new link
  };

  // Handle device drop from palette - INSTANT ADD!
  const handleDeviceDrop = async (deviceType: string, x: number, y: number) => {
    // Import utility
    const { createNodeWithDefaults } = await import("@/utils/deviceDefaults");
    
    // Create node with auto-filled defaults
    const nodeData = createNodeWithDefaults(deviceType as any, x, y, nodes);
    
    // Add immediately
    await createNode(nodeData);
    
    // Show success toast
    toast({
      title: "Device Ditambahkan!",
      description: `${nodeData.name} berhasil ditambahkan. Klik device untuk edit detail.`,
    });
    
    // Refresh to show new node
    loadData();
  };



  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast({
          title: "Fullscreen Mode",
          description: "Press ESC to exit fullscreen",
        });
      }).catch((err) => {
        toast({
          title: "Error",
          description: "Could not enter fullscreen mode",
          variant: "destructive",
        });
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);



  return (
    <div 
      ref={containerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'space-y-6'}`}
    >
       







      {/* Map Views with Integrated Device Palette */}
      <Card className={`network-map-canvas-container relative ${isFullscreen ? 'fixed inset-0 z-50 h-screen border-0 rounded-none' : ''}`}>
        <CardContent className={`${isFullscreen ? 'p-0 h-screen' : 'p-0'}`}>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full h-full">
            {!isFullscreen && (
            <div className="border-b px-6 pt-6">
              <TabsList>
                <TabsTrigger value="interactive" className="flex items-center gap-2">
                  <NetworkIcon className="h-4 w-4" />
                  Interactive
                </TabsTrigger>
                <TabsTrigger value="tree" className="flex items-center gap-2">
                  <NetworkIcon className="h-4 w-4" />
                  Tree View
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4" />
                  Grid View
                </TabsTrigger>
                <TabsTrigger value="geographical" className="flex items-center gap-2">
                  <MapIcon className="h-4 w-4" />
                  Geographical Map
                </TabsTrigger>
              </TabsList>
            </div>
            )}

            <div 
              className="relative" 
              style={{ 
                height: isFullscreen ? '100vh' : 'calc(100vh - 250px)', 
                minHeight: isFullscreen ? '100vh' : '700px' 
              }}
            >
              <TabsContent value="interactive" className="mt-0 h-full relative">
                {/* Canvas Area - Full height */}
                <div className="absolute inset-0" style={{ bottom: paletteCollapsed ? 0 : '180px' }}>
                  <InteractiveCanvas
                    ref={canvasRef}
                    nodes={nodes}
                    links={links}
                    onNodeClick={handleNodeClick}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    onLinkClick={handleLinkClick}
                    onNodeDragEnd={handleNodeDragEnd}
                    onDeviceDrop={handleDeviceDrop}
                    onLinkCreate={handleLinkCreate}
                    onLinkCreateWithPorts={handleLinkCreateWithPorts}
                    onToggleFullscreen={toggleFullscreen}
                    onCanvasClick={handleCanvasClick}
                    onNodeUpdate={loadData}
                    selectedNodeId={selectedNode?.id}
                    isFullscreen={isFullscreen}
                  />
                </div>
                
                {/* Device Palette - Fixed at Bottom */}
                {!paletteCollapsed && (
                  <div className="absolute bottom-0 left-0 right-0 h-[180px] bg-background border-t z-50">
                    <DevicePalette 
                      collapsed={false}
                      onToggleCollapse={() => setPaletteCollapsed(true)}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tree" className="mt-0">
                <div className="h-[800px] relative">
                  <TreeView
                    nodes={nodes}
                    links={links}
                    onNodeClick={handleNodeClick}
                    onNodeDragEnd={handleNodeDragEnd}
                    selectedNodeId={selectedNode?.id}
                  />
                </div>
              </TabsContent>

              <TabsContent value="grid" className="mt-0">
                <div className="h-[800px] relative">
                  <GridView
                    nodes={nodes}
                    links={links}
                    onNodeClick={handleNodeClick}
                    onNodeDragEnd={handleNodeDragEnd}
                    selectedNodeId={selectedNode?.id}
                  />
                </div>
              </TabsContent>

              <TabsContent value="geographical" className="mt-0">
                <div className="h-[800px] relative">
                  <GeographicalView
                    nodes={nodes}
                    links={links}
                    onNodeClick={handleNodeClick}
                    selectedNodeId={selectedNode?.id}
                  />
                </div>
              </TabsContent>

              {/* Node Details Panel - Only show on double-click */}
              {selectedNode && showNodeDetails && (
                <NodeDetailsPanel
                  node={selectedNode}
                  onClose={() => {
                    setSelectedNode(null);
                    setShowNodeDetails(false);
                  }}
                  onDelete={handleDeleteNode}
                />
              )}

              {/* Link Details Panel */}
              {selectedLink && (
                <LinkDetailsPanel
                  link={selectedLink}
                  sourceNode={nodes.find(n => n.id === selectedLink.source_node_id)}
                  targetNode={nodes.find(n => n.id === selectedLink.target_node_id)}
                  onClose={() => setSelectedLink(null)}
                  onDelete={handleDeleteLink}
                />
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>




      </div>
  );
};

export default NetworkMap;
