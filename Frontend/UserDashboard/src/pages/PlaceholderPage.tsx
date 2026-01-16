
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  showTabs?: boolean;
  tabs?: Array<{ id: string; label: string; content: React.ReactNode }>;
}

const PlaceholderPage = ({ 
  title, 
  description, 
  icon: Icon,
  showTabs = false,
  tabs = []
}: PlaceholderPageProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      
      <Card>
        <CardHeader className="flex-row space-y-0 gap-2 items-center">
          <Icon className="h-5 w-5 text-rtwnet-600" />
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
          
          {showTabs ? (
            <Tabs defaultValue={tabs[0]?.id} className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {tabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-lg mt-4">
              <p className="text-muted-foreground text-center">
                Halaman ini sedang dalam pengembangan.<br />
                Segera hadir dengan fitur lengkap!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
