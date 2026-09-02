import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";
import { BOOKING_STATUS_LABELS } from "@/types";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Circle,
} from "lucide-react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const statusConfig: Record<
  BookingStatus | "available",
  { variant: BadgeProps["variant"]; icon: React.ReactNode }
> = {
  available: { variant: "success", icon: <Circle className="h-3 w-3" /> },
  pending: { variant: "warning", icon: <Clock className="h-3 w-3" /> },
  approved: { variant: "secondary", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
  cancelled: { variant: "muted", icon: <Ban className="h-3 w-3" /> },
};

export function StatusBadge({
  status,
  className,
}: {
  status: BookingStatus | "available";
  className?: string;
}) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={className} aria-label={`Status: ${BOOKING_STATUS_LABELS[status]}`}>
      {config.icon}
      {BOOKING_STATUS_LABELS[status]}
    </Badge>
  );
}

export { Badge, badgeVariants };
