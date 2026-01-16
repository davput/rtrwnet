
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  iconColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  iconColor,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden border border-border/50 transition-shadow hover:shadow-md h-full", className)}>
      <CardContent className="p-6 h-full">
        <div className="flex items-start justify-between h-full">
          <div className="flex-1 flex flex-col">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-foreground">{value}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{description || "\u00A0"}</p>
            
            <div className="flex items-center gap-1 mt-auto pt-2">
              {trend && trendValue ? (
                <span 
                  className={cn(
                    "text-xs font-medium line-clamp-1",
                    trend === "up" && "text-emerald-500",
                    trend === "down" && "text-red-500",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {trendValue}
                </span>
              ) : (
                <span className="text-xs">&nbsp;</span>
              )}
            </div>
          </div>
          
          <div className={cn(
            "p-3 rounded-xl flex-shrink-0 ml-4", 
            iconColor || "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5", 
              iconColor?.includes("text-") ? "" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
