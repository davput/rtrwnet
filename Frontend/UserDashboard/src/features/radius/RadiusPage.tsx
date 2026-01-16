import { NASTab } from "./components/NASTab";
import { Radio } from "lucide-react";

export function RadiusPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Radio className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MikroTik Router</h1>
          <p className="text-sm text-muted-foreground">
            Daftarkan MikroTik router untuk integrasi PPPoE
          </p>
        </div>
      </div>

      <NASTab />
    </div>
  );
}

export default RadiusPage;
