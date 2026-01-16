import { NetworkNode } from "@/types/networkTopology";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Edit, Trash2, MapPin, Network } from "lucide-react";
import { NODE_COLORS } from "@/types/networkTopology";

const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

interface NodeDetailsPanelProps {
  node: NetworkNode | null;
  onClose: () => void;
  onEdit?: (node: NetworkNode) => void;
  onDelete?: (node: NetworkNode) => void;
}

const NodeDetailsPanel = ({ node, onClose, onEdit, onDelete }: NodeDetailsPanelProps) => {
  if (!node) return null;

  return (
    <Card className="absolute top-4 right-4 w-80 shadow-lg z-10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{node.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge 
            style={{ backgroundColor: NODE_COLORS[node.status] }}
            className="text-white"
          >
            {node.status}
          </Badge>
        </div>

        {/* Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Type</span>
          <Badge variant="secondary">{node.type}</Badge>
        </div>

        {/* Level */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Level</span>
          <span className="text-sm font-medium">{node.level}</span>
        </div>

        {/* IP Address */}
        {node.ip_address && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">IP Address</span>
            <span className="text-sm font-mono">{node.ip_address}</span>
          </div>
        )}

        {/* MAC Address */}
        {node.mac_address && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">MAC Address</span>
            <span className="text-sm font-mono">{node.mac_address}</span>
          </div>
        )}

        {/* Model */}
        {node.model && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Model</span>
            <span className="text-sm">{node.model}</span>
          </div>
        )}

        {/* Location */}
        {node.location && (
          <div>
            <span className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3" />
              Location
            </span>
            <p className="text-sm">{node.location}</p>
          </div>
        )}

        {/* Latency */}
        {node.latency_ms !== undefined && node.latency_ms !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Latency</span>
            <Badge 
              variant={node.latency_ms < 10 ? 'default' : node.latency_ms < 50 ? 'secondary' : 'destructive'}
            >
              {node.latency_ms.toFixed(1)} ms
            </Badge>
          </div>
        )}

        {/* Packet Loss */}
        {node.packet_loss_percent !== undefined && node.packet_loss_percent !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Packet Loss</span>
            <span className="text-sm font-medium">{node.packet_loss_percent.toFixed(2)}%</span>
          </div>
        )}

        {/* Uptime */}
        {node.uptime_seconds !== undefined && node.uptime_seconds !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Uptime</span>
            <span className="text-sm font-medium">{formatUptime(node.uptime_seconds)}</span>
          </div>
        )}

        {/* Traffic RX */}
        {node.rx_bytes !== undefined && node.rx_bytes !== null && (
          <div>
            <span className="text-sm text-muted-foreground mb-1 block">Download</span>
            <div className="flex items-center justify-between">
              <span className="text-xs">Total:</span>
              <span className="text-xs font-mono">{formatBytes(node.rx_bytes)}</span>
            </div>
            {node.rx_rate && (
              <div className="flex items-center justify-between">
                <span className="text-xs">Rate:</span>
                <span className="text-xs font-mono">{node.rx_rate}</span>
              </div>
            )}
          </div>
        )}

        {/* Traffic TX */}
        {node.tx_bytes !== undefined && node.tx_bytes !== null && (
          <div>
            <span className="text-sm text-muted-foreground mb-1 block">Upload</span>
            <div className="flex items-center justify-between">
              <span className="text-xs">Total:</span>
              <span className="text-xs font-mono">{formatBytes(node.tx_bytes)}</span>
            </div>
            {node.tx_rate && (
              <div className="flex items-center justify-between">
                <span className="text-xs">Rate:</span>
                <span className="text-xs font-mono">{node.tx_rate}</span>
              </div>
            )}
          </div>
        )}

        {/* Last Seen */}
        {node.last_seen && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Seen</span>
            <span className="text-xs">{new Date(node.last_seen).toLocaleString('id-ID')}</span>
          </div>
        )}

        {/* Coordinates */}
        {node.latitude && node.longitude && (
          <div>
            <span className="text-sm text-muted-foreground mb-1 block">Coordinates</span>
            <p className="text-xs font-mono">
              {node.latitude.toFixed(6)}, {node.longitude.toFixed(6)}
            </p>
          </div>
        )}

        {/* Notes */}
        {node.notes && (
          <div>
            <span className="text-sm text-muted-foreground mb-1 block">Notes</span>
            <p className="text-sm">{node.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit(node)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex-1"
              onClick={() => onDelete(node)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NodeDetailsPanel;
