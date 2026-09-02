"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Basketball } from "@/components/ui/basketball-icon";
import { useTheme } from "next-themes";

interface ContentLoaderProps {
  label?: string;
  className?: string;
  fullHeight?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ContentLoader({
  label = "Loading...",
  className,
  fullHeight = true,
  size = "md",
}: ContentLoaderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const sizes = {
    sm: { wrapper: "h-32", ball: "h-5 w-5", orbit: 18, ringOffset: "-inset-1" },
    md: { wrapper: "h-64", ball: "h-7 w-7", orbit: 26, ringOffset: "-inset-2" },
    lg: { wrapper: "h-96", ball: "h-9 w-9", orbit: 34, ringOffset: "-inset-3" },
  }[size];

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-6",
        fullHeight && sizes.wrapper,
        className
      )}
    >
      <div className="relative" style={{ width: sizes.orbit * 2 + 20, height: sizes.orbit * 2 + 20 }}>
        <div
          aria-hidden
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl",
            isDark ? "bg-primary/20" : "bg-primary/10"
          )}
          style={{ width: sizes.orbit * 3, height: sizes.orbit * 3 }}
        />

        <motion.div
          aria-hidden
          className={cn("absolute left-1/2 top-1/2 rounded-full border border-primary/40", sizes.ringOffset)}
          style={{ margin: "auto" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_2px_hsl(var(--primary)/0.6)]"
            style={{ top: -5, width: 10, height: 10 }}
          />
        </motion.div>

        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 rounded-full border border-dashed border-primary/20"
          style={{
            margin: "auto",
            width: sizes.orbit * 2 + 8,
            height: sizes.orbit * 2 + 8,
            transform: "translate(-50%, -50%)",
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-primary/95 p-1.5 ring-2 ring-background shadow-lg"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          style={{
            width: `calc(${sizes.orbit}px + 12px)`,
            height: `calc(${sizes.orbit}px + 12px)`,
          }}
        >
          <Basketball
            aria-hidden
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20",
              sizes.ball
            )}
            strokeWidth={2.3}
          />
          <img
            src="/icon.png"
            alt="Rimreserve"
            loading="eager"
            decoding="sync"
            draggable={false}
            className="relative z-10 h-full w-full rounded-xl object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>
      </div>

      <motion.p
        className="relative text-sm font-medium text-muted-foreground/80 overflow-hidden"
        initial={{ backgroundPosition: "-200% 0" }}
        animate={{ backgroundPosition: "200% 0" }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--muted-foreground)/0.3) 0%, hsl(var(--muted-foreground)/0.9) 50%, hsl(var(--muted-foreground)/0.3) 100%)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {label}
      </motion.p>
    </div>
  );
}
