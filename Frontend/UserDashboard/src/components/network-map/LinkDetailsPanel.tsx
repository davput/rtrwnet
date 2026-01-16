import { NetworkLink, NetworkNode, LINK_COLORS } from "@/types/networkTopology";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Edit, Trash2, Activity } from "lucide-react";

interface LinkDetailsPanelProps {
  link: NetworkLink | null;
  sourceNode?: NetworkNode;
  targetNode?: NetworkNode;
  onClose: () => void;
  onEdit?: (link: NetworkLink) => void;
  onDelete?: (link: NetworkLink) => void;
}

const LinkDetailsPanel = ({ 
  link, 
  sourceNode, 
  targetNode, 
  onClose, 
  onEdit, 
  onDelete 
}: LinkDetailsPanelProps) => {
  if (!link) return null;

  const statusColor = LINK_COLORS[link.status] || LINK_COLORS.unknown;

  return (
    <Card className="absolute top-4 left-4 w-80 shadow-lg z-10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Link Details
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Link Name */}
        {link.name && (
          <div>
            <h3 className="font-semibold text-base">{link.name}</h3>
          </div>
        )}

        {/* Connection */}
        <div>
          <span className="text-sm text-muted-foreground mb-2 block">Connection</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">From:</span>
              <span className="text-sm font-medium">{sourceNode?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">To:</span>
              <span className="text-sm font-medium">{targetNode?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge 
            style={{ backgroundColor: statusColor }}
            className="text-white"
          >
            {link.status}
          </Badge>
        </div>

        {/* Link Type */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Type</span>
          <Badge variant="secondary">{link.link_type}</Badge>
        </div>

        {/* Bandwidth */}
        {link.bandwidth && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Bandwidth</span>
            <span className="text-sm font-medium">{link.bandwidth}</span>
          </div>
        )}

        {/* Latency */}
        {link.latency_ms !== undefined && link.latency_ms !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Latency</span>
            <Badge 
              variant={link.latency_ms < 10 ? 'default' : link.latency_ms < 50 ? 'secondary' : 'destructive'}
            >
              {link.latency_ms.toFixed(1)} ms
            </Badge>
          </div>
        )}

        {/* Packet Loss */}
        {link.packet_loss_percent !== undefined && link.packet_loss_percent !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Packet Loss</span>
            <span className="text-sm font-medium">
              {link.packet_loss_percent.toFixed(2)}%
            </span>
          </div>
        )}

        {/* Distance */}
        {link.distance_km && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Distance</span>
            <span className="text-sm font-medium">{link.distance_km} km</span>
          </div>
        )}

        {/* Visual Properties */}
        <div>
          <span className="text-sm text-muted-foreground mb-2 block">Visual</span>
          <div className="space-y-1">
            {link.color && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Color:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: link.color }}
                  />
                  <span className="text-xs font-mono">{link.color}</span>
                </div>
              </div>
            )}
            {link.width && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Width:</span>
                <span className="text-xs">{link.width}px</span>
              </div>
            )}
            {link.style && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Style:</span>
                <span className="text-xs">{link.style}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {link.notes && (
          <div>
            <span className="text-sm text-muted-foreground mb-1 block">Notes</span>
            <p className="text-sm">{link.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit(link)}
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
              onClick={() => onDelete(link)}
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

export default LinkDetailsPanel;
