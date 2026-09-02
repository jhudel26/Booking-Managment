"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Circle, Wifi, Database, CalendarCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { Basketball } from "@/components/ui/basketball-icon";
import { useTheme } from "next-themes";
import type { LoadingStage } from "@/components/providers/site-status-provider";
import { STAGE_INFO } from "@/components/providers/site-status-provider";

interface AppLoadingScreenProps {
  show: boolean;
  minDuration?: number;
  tips?: string[];
  onExited?: () => void;
  realProgress?: number;
  realStage?: LoadingStage;
  realTip?: string;
}

const DEFAULT_TIPS = [
  "Loading the court...",
  "Warming up the balls...",
  "Checking availability...",
  "Preparing your reservation...",
  "Dribbling through the database...",
  "Smoothing out the hardwood...",
];

const STAGE_ICONS: Record<LoadingStage, React.ReactNode> = {
  hydrating: <Circle className="h-3.5 w-3.5" />,
  connecting: <Wifi className="h-3.5 w-3.5" />,
  loading_data: <Database className="h-3.5 w-3.5" />,
  finalizing: <CalendarCheck className="h-3.5 w-3.5" />,
  ready: <CheckCircle2 className="h-3.5 w-3.5" />,
};

const STAGE_ORDER: LoadingStage[] = [
  "hydrating",
  "connecting",
  "loading_data",
  "finalizing",
  "ready",
];

export function AppLoadingScreen({
  show,
  tips = DEFAULT_TIPS,
  onExited,
  realProgress,
  realStage,
  realTip,
}: AppLoadingScreenProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [tipIndex, setTipIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!show || !mounted || realTip) return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 2200);
    return () => clearInterval(id);
  }, [show, tips.length, mounted, realTip]);

  const hasRealStatus = typeof realProgress === "number";
  const effectiveProgress = Math.max(
    0,
    Math.min(100, hasRealStatus ? realProgress : 96)
  );
  const effectiveTip = realTip ?? tips[tipIndex];
  const effectiveStage: LoadingStage = realStage ?? "hydrating";
  const isError = effectiveTip.toLowerCase().includes("error") ||
    effectiveTip.toLowerCase().includes("unable") ||
    effectiveTip.toLowerCase().includes("failed") ||
    effectiveTip.toLowerCase().includes("http ");

  const progressBarDuration = useMemo(() => {
    if (!hasRealStatus) return 2.1;
    return 0.35;
  }, [hasRealStatus]);

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={onExited}>
      {show && (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[70vmax] w-[70vmax] rounded-full blur-3xl opacity-40"
              style={{
                background: isDark
                  ? "radial-gradient(closest-side, hsl(var(--primary)/0.25), transparent 70%)"
                  : "radial-gradient(closest-side, hsl(var(--primary)/0.15), transparent 70%)",
              }}
            />
          </motion.div>

          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: isDark
                ? "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)"
                : "linear-gradient(rgba(0,0,0,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.8) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            }}
          />

          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: "spring", stiffness: 220, damping: 18 }}
            className="relative flex flex-col items-center gap-8 px-6"
          >
            <div className="relative">
              <motion.div
                aria-hidden
                className="absolute -inset-6 rounded-full border-2 border-primary/30"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity: [0.35, 0, 0.35],
                  scale: [0.6, 1.4, 0.6],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                aria-hidden
                className="absolute -inset-10 rounded-full border border-primary/15"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity: [0.25, 0, 0.25],
                  scale: [0.7, 1.6, 0.7],
                }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />

              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.5)]"
                  animate={{
                    boxShadow: [
                      "0 10px 40px -10px hsl(var(--primary)/0.5)",
                      "0 20px 60px -10px hsl(var(--primary)/0.7)",
                      "0 10px 40px -10px hsl(var(--primary)/0.5)",
                    ],
                  }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <Circle
                  aria-hidden
                  className="absolute h-12 w-12 text-primary-foreground/20"
                />
                <img
                  src="/icon.png"
                  alt="Rimreserve"
                  loading="eager"
                  decoding="sync"
                  draggable={false}
                  className="relative z-10 h-20 w-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />

                <motion.div
                  className="absolute -right-3 -bottom-3 z-20"
                  initial={{ y: 0, rotate: 0 }}
                  animate={{
                    y: [-2, -22, -2],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                  }}
                >
                  <div className="rounded-full bg-orange-500 p-1.5 shadow-lg ring-2 ring-background">
                    <Basketball className="h-7 w-7 text-white" strokeWidth={2.4} />
                  </div>
                </motion.div>

                <motion.div
                  aria-hidden
                  className="absolute -right-3 -bottom-6 h-1.5 w-7 rounded-full bg-foreground/25 blur-[2px]"
                  animate={{ opacity: [0.35, 0.1, 0.35], scaleX: [1, 0.65, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="text-center"
            >
              <h2 className="text-3xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  RIM
                </span>
                <span className="text-foreground/90">|RESERVE</span>
              </h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Basketball Court Booking System
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="w-80 space-y-5"
            >
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    isError
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                      : "bg-gradient-to-r from-primary via-primary/80 to-primary"
                  }`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${effectiveProgress}%` }}
                  transition={{ duration: progressBarDuration, ease: "easeOut" }}
                />
                <motion.div
                  aria-hidden
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/15"
                  initial={{ x: "-100%" }}
                  animate={{ x: "300%" }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {isError ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    STAGE_ICONS[effectiveStage]
                  )}
                  <span className={isError ? "text-amber-600 dark:text-amber-400" : ""}>
                    {isError
                      ? "Connection notice"
                      : STAGE_INFO[effectiveStage]?.label ?? "Loading..."}
                  </span>
                </div>
                <span className="tabular-nums">{effectiveProgress}%</span>
              </div>

              {hasRealStatus && (
                <ol className="space-y-1.5">
                  {STAGE_ORDER.slice(0, -1).map((s, idx) => {
                    const activeIdx = STAGE_ORDER.indexOf(effectiveStage);
                    const isDone = idx < activeIdx;
                    const isActive = idx === activeIdx;
                    const label = STAGE_INFO[s].label;
                    return (
                      <li
                        key={s}
                        className="flex items-center gap-2 text-[11px]"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isDone
                              ? "border-primary/70 bg-primary text-primary-foreground"
                              : isActive
                                ? "border-primary/60 text-primary"
                                : "border-muted-foreground/25 text-muted-foreground/40"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-2.5 w-2.5" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          )}
                        </span>
                        <span
                          className={`transition-colors ${
                            isDone
                              ? "text-foreground/80"
                              : isActive
                                ? "text-foreground font-medium"
                                : "text-muted-foreground/45"
                          }`}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="h-5 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={effectiveTip}
                    initial={{ y: 18, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -18, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`text-center text-xs font-medium ${
                      isError
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {effectiveTip}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.4 }}
            className="absolute bottom-8 text-center text-xs text-muted-foreground"
          >
            ST. JOSEPH VILLAGE 6 PHASE 4 · CABUYAO CITY, LAGUNA
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
