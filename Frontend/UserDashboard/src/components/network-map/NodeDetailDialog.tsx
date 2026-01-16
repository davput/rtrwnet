import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NetworkNode } from "@/types/networkTopology";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Network, 
  MapPin, 
  Activity, 
  Clock, 
  Wifi, 
  HardDrive,
  Cpu,
  MemoryStick
} from "lucide-react";

interface NodeDetailDialogProps {
  node: NetworkNode | null;
  open: boolean;
  onClose: () => void;
}

const NodeDetailDialog = ({ node, open, onClose }: NodeDetailDialogProps) => {
  if (!node) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'warning': return 'Warning';
      default: return 'Unknown';
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days} days, ${hours} hours`;
    if (hours > 0) return `${hours} hours, ${minutes} minutes`;
    return `${minutes} minutes`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Network className="h-6 w-6" />
            {node.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`}></div>
              <span className="font-semibold">{getStatusText(node.status)}</span>
            </div>
            <Badge variant="outline" className="uppercase">
              {node.type}
            </Badge>
            {node.level !== undefined && (
              <Badge variant="secondary">
                Level {node.level}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Network Information</h3>
              
              {node.ip_address && (
                <div className="flex items-start gap-2">
                  <Network className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">IP Address</div>
                    <div className="font-mono text-sm">{node.ip_address}</div>
                  </div>
                </div>
              )}

              {node.mac_address && (
                <div className="flex items-start gap-2">
                  <HardDrive className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">MAC Address</div>
                    <div className="font-mono text-sm">{node.mac_address}</div>
                  </div>
                </div>
              )}

              {node.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="text-sm">{node.location}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Performance</h3>
              
              {node.latency_ms !== undefined && node.latency_ms !== null && (
                <div className="flex items-start gap-2">
                  <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Latency</div>
                    <div className="text-sm font-semibold">{node.latency_ms.toFixed(2)} ms</div>
                  </div>
                </div>
              )}

              {node.uptime_seconds !== undefined && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                    <div className="text-sm">{formatUptime(node.uptime_seconds)}</div>
                  </div>
                </div>
              )}

              {node.bandwidth && (
                <div className="flex items-start gap-2">
                  <Wifi className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Bandwidth</div>
                    <div className="text-sm font-semibold">{node.bandwidth}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Device Specifications */}
          {(node.cpu_usage || node.memory_usage || node.disk_usage) && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">System Resources</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {node.cpu_usage !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Cpu className="h-3 w-3" />
                        CPU Usage
                      </div>
                      <div className="text-2xl font-bold">{node.cpu_usage}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            node.cpu_usage > 80 ? 'bg-red-500' : 
                            node.cpu_usage > 60 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${node.cpu_usage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {node.memory_usage !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MemoryStick className="h-3 w-3" />
                        Memory Usage
                      </div>
                      <div className="text-2xl font-bold">{node.memory_usage}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            node.memory_usage > 80 ? 'bg-red-500' : 
                            node.memory_usage > 60 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${node.memory_usage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {node.disk_usage !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <HardDrive className="h-3 w-3" />
                        Disk Usage
                      </div>
                      <div className="text-2xl font-bold">{node.disk_usage}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            node.disk_usage > 80 ? 'bg-red-500' : 
                            node.disk_usage > 60 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${node.disk_usage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Additional Information */}
          {node.description && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Description</h3>
              <p className="text-sm text-muted-foreground">{node.description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold">Created:</span>{' '}
              {new Date(node.created_at).toLocaleString()}
            </div>
            {node.updated_at && (
              <div>
                <span className="font-semibold">Updated:</span>{' '}
                {new Date(node.updated_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NodeDetailDialog;
