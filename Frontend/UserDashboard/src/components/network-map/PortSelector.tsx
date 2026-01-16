import { useState, useEffect } from "react";
import { NetworkNode, DevicePort } from "@/types/networkTopology";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, Circle } from "lucide-react";

interface PortSelectorProps {
  node: NetworkNode;
  ports: DevicePort[];
  onSelectPort: (port: DevicePort) => void;
  onCancel: () => void;
  position: { x: number; y: number };
  selectedPort?: DevicePort;
}

const PortSelector = ({
  node,
  ports,
  onSelectPort,
  onCancel,
  position,
  selectedPort,
}: PortSelectorProps) => {
  const [hoveredPort, setHoveredPort] = useState<string | null>(null);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const getPortStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return 'bg-green-500';
      case 'down':
        return 'bg-red-500';
      case 'disabled':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getPortTypeIcon = (type: string) => {
    switch (type) {
      case 'sfp':
      case 'sfp+':
        return '🔌';
      case 'wireless':
        return '📡';
      default:
        return '🔗';
    }
  };

  // Calculate position to keep panel in viewport
  const adjustedPosition = {
    x: Math.max(160, Math.min(position.x, window.innerWidth - 160)),
    y: Math.max(200, position.y),
  };

  return (
    <Card
      className="absolute z-50 shadow-2xl border-2 border-blue-500 min-w-[280px] max-w-[320px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        transform: 'translate(-50%, -100%) translateY(-10px)',
      }}
    >
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
            Select Port - {node.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Choose an available port to connect
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {ports.map((port) => {
            const isDisabled = port.isConnected || port.status === 'disabled';
            const isSelected = selectedPort?.id === port.id;
            const isHovered = hoveredPort === port.id;

            return (
              <button
                key={port.id}
                onClick={() => !isDisabled && onSelectPort(port)}
                onMouseEnter={() => setHoveredPort(port.id)}
                onMouseLeave={() => setHoveredPort(null)}
                disabled={isDisabled}
                className={`
                  w-full flex items-center justify-between p-2 rounded-md
                  transition-all duration-150
                  ${isDisabled
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                    : isSelected
                    ? 'bg-blue-500 text-white shadow-md'
                    : isHovered
                    ? 'bg-blue-50 dark:bg-blue-950 border border-blue-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getPortTypeIcon(port.type)}</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{port.name}</div>
                    <div className="text-xs opacity-75">
                      {port.type.toUpperCase()}
                      {port.speed && ` • ${port.speed}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {port.isConnected && (
                    <Badge variant="secondary" className="text-xs">
                      In Use
                    </Badge>
                  )}
                  {!port.isConnected && (
                    <div
                      className={`h-2 w-2 rounded-full ${getPortStatusColor(
                        port.status
                      )}`}
                      title={port.status.toUpperCase()}
                    />
                  )}
                  {isSelected && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {ports.filter((p) => !p.isConnected && p.status !== 'disabled').length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No available ports
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortSelector;
