import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network } from 'lucide-react';
import { OLTList } from './components/OLTList';
import { ODCList } from './components/ODCList';
import { ODPList } from './components/ODPList';
import { NetworkMap } from './components/NetworkMap';

export function InfrastructurePage() {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Network className="h-6 w-6 text-rtwnet-600" />
        <h1 className="text-2xl font-bold tracking-tight">Infrastruktur Jaringan</h1>
      </div>

      <Tabs defaultValue="map" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-4 md:w-[500px]">
          <TabsTrigger value="map">Peta</TabsTrigger>
          <TabsTrigger value="olt">OLT</TabsTrigger>
          <TabsTrigger value="odc">ODC</TabsTrigger>
          <TabsTrigger value="odp">ODP</TabsTrigger>
        </TabsList>
        <TabsContent value="map" className="space-y-4 mt-6">
          <NetworkMap />
        </TabsContent>
        <TabsContent value="olt" className="space-y-4 mt-6">
          <OLTList />
        </TabsContent>
        <TabsContent value="odc" className="space-y-4 mt-6">
          <ODCList />
        </TabsContent>
        <TabsContent value="odp" className="space-y-4 mt-6">
          <ODPList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default InfrastructurePage;
