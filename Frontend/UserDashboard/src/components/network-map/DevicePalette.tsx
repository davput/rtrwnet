import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Router, 
  Network, 
  Server, 
  Box, 
  Wifi, 
  Radio, 
  Monitor,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type DeviceType = 'router' | 'switch' | 'olt' | 'ont' | 'ap' | 'repeater' | 'client';

interface DeviceTemplate {
  type: DeviceType;
  name: string;
  icon: React.ReactNode;
  color: string;
  category: 'core' | 'distribution' | 'access' | 'client';
}

const deviceTemplates: DeviceTemplate[] = [
  {
    type: 'router',
    name: 'Router',
    icon: <Router className="h-6 w-6" />,
    color: '#3498db',
    category: 'core'
  },
  {
    type: 'switch',
    name: 'Switch',
    icon: <Network className="h-6 w-6" />,
    color: '#2ecc71',
    category: 'distribution'
  },
  {
    type: 'olt',
    name: 'OLT',
    icon: <Server className="h-6 w-6" />,
    color: '#9b59b6',
    category: 'core'
  },
  {
    type: 'ont',
    name: 'ONT',
    icon: <Box className="h-6 w-6" />,
    color: '#e74c3c',
    category: 'access'
  },
  {
    type: 'ap',
    name: 'AP',
    icon: <Wifi className="h-6 w-6" />,
    color: '#f39c12',
    category: 'access'
  },
  {
    type: 'repeater',
    name: 'Repeater',
    icon: <Radio className="h-6 w-6" />,
    color: '#1abc9c',
    category: 'distribution'
  },
  {
    type: 'client',
    name: 'Client',
    icon: <Monitor className="h-6 w-6" />,
    color: '#95a5a6',
    category: 'client'
  }
];

interface DevicePaletteProps {
  onDeviceDragStart?: (deviceType: DeviceType) => void;
  onDeviceDragEnd?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const DevicePalette = ({ 
  onDeviceDragStart, 
  onDeviceDragEnd,
  collapsed = false,
  onToggleCollapse
}: DevicePaletteProps) => {
  const [activeTab, setActiveTab] = useState('core');

  const handleDragStart = (e: React.DragEvent, deviceType: DeviceType) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('deviceType', deviceType);
    
    if (onDeviceDragStart) {
      onDeviceDragStart(deviceType);
    }
  };

  const handleDragEnd = () => {
    if (onDeviceDragEnd) {
      onDeviceDragEnd();
    }
  };

  const categories = [
    { id: 'core', name: 'Core' },
    { id: 'distribution', name: 'Distribution' },
    { id: 'access', name: 'Access' },
    { id: 'client', name: 'Client' }
  ];

  if (collapsed) {
    return null; // Don't show anything when collapsed
  }

  return (
    <div className="w-full border-t bg-card">
      <div className="flex items-center justify-between px-3 py-1 border-b">
        <h3 className="text-xs font-semibold">Device Palette</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-6 w-6 p-0"
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-8">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-xs h-8"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => {
          const categoryDevices = deviceTemplates.filter(d => d.category === category.id);
          
          return (
            <TabsContent key={category.id} value={category.id} className="mt-0 p-2">
              <div className="flex gap-2 flex-wrap">
                {categoryDevices.map((device) => (
                  <div
                    key={device.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, device.type)}
                    onDragEnd={handleDragEnd}
                    className="flex flex-col items-center gap-1 p-2 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 cursor-move hover:scale-105 transition-all bg-white dark:bg-gray-800 shadow-sm hover:shadow-md min-w-[70px]"
                    style={{ 
                      borderLeftWidth: '3px',
                      borderLeftColor: device.color,
                      borderLeftStyle: 'solid'
                    }}
                  >
                    <div 
                      className="flex items-center justify-center"
                      style={{ color: device.color }}
                    >
                      {device.icon}
                    </div>
                    <p className="text-[10px] font-semibold text-center leading-tight">{device.name}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default DevicePalette;
