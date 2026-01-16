
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface NetworkStatusProps {
  title: string;
  value: number;
  max: number;
  unit: string;
  status?: "good" | "warning" | "critical";
  className?: string;
}

export function NetworkStatusCard({
  title, 
  value,
  max,
  unit,
  status = "good",
  className
}: NetworkStatusProps) {
  const percentage = (value / max) * 100;
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end mb-1">
          <span className="text-xl font-bold">
            {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
          </span>
          <span className="text-sm text-muted-foreground">Max: {max} {unit}</span>
        </div>
        <Progress 
          value={percentage} 
          className={cn(
            status === "good" && "bg-gray-100",
            status === "warning" && "bg-amber-100",
            status === "critical" && "bg-red-100",
          )}
        />
        <div className="mt-2">
          <StatusBadge status={status} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: "good" | "warning" | "critical" }) {
  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "good" && "bg-green-100 text-green-800",
        status === "warning" && "bg-amber-100 text-amber-800",
        status === "critical" && "bg-red-100 text-red-800",
      )}
    >
      <span 
        className={cn(
          "mr-1 h-1.5 w-1.5 rounded-full",
          status === "good" && "bg-green-500",
          status === "warning" && "bg-amber-500",
          status === "critical" && "bg-red-500",
        )} 
      />
      {status === "good" && "Normal"}
      {status === "warning" && "Perhatian"}
      {status === "critical" && "Kritis"}
    </div>
  );
}
