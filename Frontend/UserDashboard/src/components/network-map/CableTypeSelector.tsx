import { Button } from "@/components/ui/button";
import { Cable, Wifi, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type CableType = 'utp' | 'fiber' | 'wireless';

interface CableTypeSelectorProps {
  selectedType: CableType;
  onTypeChange: (type: CableType) => void;
  className?: string;
}

const CableTypeSelector = ({
  selectedType,
  onTypeChange,
  className
}: CableTypeSelectorProps) => {
  const cableTypes = [
    {
      type: 'utp' as CableType,
      icon: Cable,
      label: 'UTP Cable',
      description: 'Auto MDI/MDI-X',
      color: 'text-blue-600'
    },
    {
      type: 'fiber' as CableType,
      icon: Zap,
      label: 'Fiber Optic',
      description: 'High Speed',
      color: 'text-orange-600'
    },
    {
      type: 'wireless' as CableType,
      icon: Wifi,
      label: 'Wireless',
      description: 'Radio Link',
      color: 'text-green-600'
    }
  ];

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3",
      className
    )}>
      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
        Select Cable Type:
      </div>
      <div className="flex flex-col gap-2">
        {cableTypes.map((cable) => {
          const Icon = cable.icon;
          const isSelected = selectedType === cable.type;
          
          return (
            <Button
              key={cable.type}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onTypeChange(cable.type)}
              className={cn(
                "justify-start h-auto py-2 px-3",
                isSelected && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 mr-2", !isSelected && cable.color)} />
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{cable.label}</span>
                <span className="text-xs opacity-70">{cable.description}</span>
              </div>
            </Button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
          Link Status:
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Active (Good)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>High Latency</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Down/Error</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CableTypeSelector;
