import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer2, 
  Hand, 
  Plus, 
  Link2, 
  Trash2, 
  Move, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Ruler,
  Pencil,
  Type
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CursorMode = 
  | 'select'    // Default - select and drag nodes
  | 'pan'       // Pan canvas
  | 'add-node'  // Add new node
  | 'add-link'  // Add connection between nodes
  | 'delete'    // Delete nodes/links
  | 'move'      // Move multiple nodes
  | 'measure'   // Measure distance
  | 'edit'      // Edit node properties
  | 'text';     // Add text labels

interface CanvasToolbarProps {
  cursorMode: CursorMode;
  onCursorModeChange: (mode: CursorMode) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitScreen?: () => void;
  onResetView?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  className?: string;
}

const CanvasToolbar = ({
  cursorMode,
  onCursorModeChange,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onResetView,
  onToggleFullscreen,
  isFullscreen = false,
  className
}: CanvasToolbarProps) => {
  const tools = [
    {
      mode: 'select' as CursorMode,
      icon: MousePointer2,
      label: 'Select',
      description: 'Select and drag nodes',
      shortcut: 'V'
    },
    {
      mode: 'pan' as CursorMode,
      icon: Hand,
      label: 'Pan',
      description: 'Pan canvas view',
      shortcut: 'H'
    },
    {
      mode: 'add-node' as CursorMode,
      icon: Plus,
      label: 'Add Node',
      description: 'Click to add device',
      shortcut: 'A'
    },
    {
      mode: 'add-link' as CursorMode,
      icon: Link2,
      label: 'Add Link',
      description: 'Connect two nodes',
      shortcut: 'L'
    },
    {
      mode: 'text' as CursorMode,
      icon: Type,
      label: 'Text',
      description: 'Add text labels',
      shortcut: 'T'
    },
    {
      mode: 'move' as CursorMode,
      icon: Move,
      label: 'Move',
      description: 'Move multiple nodes',
      shortcut: 'M'
    },
    {
      mode: 'edit' as CursorMode,
      icon: Pencil,
      label: 'Edit',
      description: 'Edit node properties',
      shortcut: 'E'
    },
    {
      mode: 'measure' as CursorMode,
      icon: Ruler,
      label: 'Measure',
      description: 'Measure distance',
      shortcut: 'R'
    },
    {
      mode: 'delete' as CursorMode,
      icon: Trash2,
      label: 'Delete',
      description: 'Delete nodes/links',
      shortcut: 'D'
    }
  ];

  return (
    <div className={cn(
      "bg-background border-b px-4 py-2 flex items-center gap-2",
      className
    )}>
      {/* Cursor Mode Tools */}
      <div className="flex items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = cursorMode === tool.mode;
          
          return (
            <Button
              key={tool.mode}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onCursorModeChange(tool.mode)}
              title={`${tool.label} (${tool.shortcut}) - ${tool.description}`}
              className={cn(
                "h-9 w-9 p-0",
                isActive && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* View Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomIn}
          title="Zoom In (+)"
          className="h-9 w-9 p-0"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onZoomOut}
          title="Zoom Out (-)"
          className="h-9 w-9 p-0"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onFitScreen}
          title="Fit to Screen (F)"
          className="h-9 w-9 p-0"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetView}
          title="Reset View (0)"
          className="h-9 w-9 p-0"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Fullscreen Toggle */}
      <div className="flex items-center gap-1">
        <Button
          variant={isFullscreen ? "default" : "ghost"}
          size="sm"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen (ESC)" : "Enter Fullscreen (F11)"}
          className="h-9 w-9 p-0"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Current Mode Indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
        <span className="font-medium">Mode:</span>
        <span className="text-foreground font-semibold">
          {tools.find(t => t.mode === cursorMode)?.label || 'Select'}
        </span>
        <span className="text-xs">
          ({tools.find(t => t.mode === cursorMode)?.shortcut})
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard Shortcuts Hint */}
      <div className="text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded">?</kbd> for shortcuts
      </div>
    </div>
  );
};

export default CanvasToolbar;
