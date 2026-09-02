import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatCard({ title, value, description, className, trend, trendValue }: StatCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      case "neutral":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01, translateY: -1 }}
      transition={{ duration: 0.15 }}
    >
      <Card className={cn("border shadow-sm", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </CardTitle>
            {trend && getTrendIcon()}
          </div>
        </CardHeader>
        <CardContent>
          <motion.p
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-3xl font-bold"
          >
            {value}
          </motion.p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trendValue && (
            <p className={cn("text-xs mt-1 font-medium", getTrendColor())}>
              {trendValue}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
