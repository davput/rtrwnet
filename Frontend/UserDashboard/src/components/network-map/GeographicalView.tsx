import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { NetworkNode, NetworkLink, LINK_COLORS, NODE_COLORS } from "@/types/networkTopology";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";

// Fix for default marker icons in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GeographicalViewProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onNodeClick?: (node: NetworkNode) => void;
  selectedNodeId?: string;
}

// Custom marker icons based on node status
const createCustomIcon = (status: string, type: string) => {
  const color = NODE_COLORS[status as keyof typeof NODE_COLORS] || NODE_COLORS.unknown;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
      ">
        ${type.charAt(0).toUpperCase()}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const GeographicalView = ({ nodes, links, onNodeClick, selectedNodeId }: GeographicalViewProps) => {
  // Filter nodes that have geographical coordinates
  const geoNodes = nodes.filter(node => node.latitude && node.longitude);

  // Default center (Jakarta, Indonesia)
  const defaultCenter: [number, number] = [-6.2088, 106.8456];
  
  // Calculate center from nodes if available
  const center: [number, number] = geoNodes.length > 0
    ? [
        geoNodes.reduce((sum, node) => sum + (node.latitude || 0), 0) / geoNodes.length,
        geoNodes.reduce((sum, node) => sum + (node.longitude || 0), 0) / geoNodes.length,
      ]
    : defaultCenter;

  if (geoNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Tidak ada node dengan koordinat geografis</p>
          <p className="text-sm text-muted-foreground">Tambahkan latitude dan longitude pada node untuk menampilkan peta</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Draw links as polylines */}
        {links.map(link => {
          const sourceNode = geoNodes.find(n => n.id === link.source_node_id);
          const targetNode = geoNodes.find(n => n.id === link.target_node_id);

          if (!sourceNode || !targetNode || !sourceNode.latitude || !targetNode.latitude) {
            return null;
          }

          const positions: [number, number][] = [
            [sourceNode.latitude, sourceNode.longitude!],
            [targetNode.latitude, targetNode.longitude!],
          ];

          const color = LINK_COLORS[link.status] || LINK_COLORS.unknown;

          return (
            <Polyline
              key={link.id}
              positions={positions}
              color={color}
              weight={link.width || 3}
              opacity={0.7}
              dashArray={link.style === 'dashed' ? '10, 10' : undefined}
            />
          );
        })}

        {/* Draw nodes as markers */}
        {geoNodes.map(node => {
          if (!node.latitude || !node.longitude) return null;

          return (
            <Marker
              key={node.id}
              position={[node.latitude, node.longitude]}
              icon={createCustomIcon(node.status, node.type)}
              eventHandlers={{
                click: () => onNodeClick && onNodeClick(node),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold mb-2">{node.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="secondary">{node.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge 
                        variant={node.status === 'online' ? 'default' : 'destructive'}
                        style={{ backgroundColor: NODE_COLORS[node.status] }}
                      >
                        {node.status}
                      </Badge>
                    </div>
                    {node.ip_address && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">IP:</span>
                        <span className="font-mono">{node.ip_address}</span>
                      </div>
                    )}
                    {node.location && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{node.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default GeographicalView;
