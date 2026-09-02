"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type LoadingStage =
  | "hydrating"
  | "connecting"
  | "loading_data"
  | "finalizing"
  | "ready";

export interface StageInfo {
  label: string;
  tip: string;
  progressWeight: number;
}

export const STAGE_INFO: Record<LoadingStage, StageInfo> = {
  hydrating: {
    label: "Warming up the court",
    tip: "Preparing Rimreserve for tip-off...",
    progressWeight: 10,
  },
  connecting: {
    label: "Connecting to the database",
    tip: "Establishing connection to Supabase services...",
    progressWeight: 30,
  },
  loading_data: {
    label: "Loading court schedule",
    tip: "Fetching reservations and availability...",
    progressWeight: 45,
  },
  finalizing: {
    label: "Finalizing",
    tip: "Smoothing out the hardwood...",
    progressWeight: 10,
  },
  ready: {
    label: "Ready",
    tip: "Court is ready — let's play!",
    progressWeight: 5,
  },
};

const STAGE_ORDER: LoadingStage[] = [
  "hydrating",
  "connecting",
  "loading_data",
  "finalizing",
  "ready",
];

function computeProgress(stage: LoadingStage, stageProgress: number): number {
  let base = 0;
  for (const s of STAGE_ORDER) {
    if (s === stage) break;
    base += STAGE_INFO[s].progressWeight;
  }
  const within = STAGE_INFO[stage].progressWeight * Math.min(1, Math.max(0, stageProgress));
  return Math.round(base + within);
}

interface SiteLoadingStatus {
  stage: LoadingStage;
  stageProgress: number;
  progress: number;
  stagesCompleted: Record<Exclude<LoadingStage, "ready">, boolean>;
  error: string | null;
  isDone: boolean;
  startedAt: number;
  currentTip: string;
}

interface SiteLoadingContextValue extends SiteLoadingStatus {
  markStageCompleted: (stage: Exclude<LoadingStage, "ready">) => void;
  setStageProgress: (value: number) => void;
  reportError: (message: string) => void;
}

const SiteLoadingContext = createContext<SiteLoadingContextValue | null>(null);

export function useSiteLoading() {
  const ctx = useContext(SiteLoadingContext);
  if (!ctx) {
    throw new Error("useSiteLoading must be used inside SiteStatusProvider");
  }
  return ctx;
}

interface SiteStatusProviderProps {
  children: React.ReactNode;
  minDisplayMs?: number;
}

export function SiteStatusProvider({
  children,
  minDisplayMs = 900,
}: SiteStatusProviderProps) {
  const [stage, setStage] = useState<LoadingStage>("hydrating");
  const [stageProgress, setStageProgressState] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(() => performance.now());
  const completedRef = useRef<
    Record<Exclude<LoadingStage, "ready">, boolean>
  >({
    hydrating: false,
    connecting: false,
    loading_data: false,
    finalizing: false,
  });
  const minTimerFiredRef = useRef(false);
  const allStagesDoneRef = useRef(false);
  const [isDone, setIsDone] = useState(false);

  const markStageCompleted = useCallback(
    (doneStage: Exclude<LoadingStage, "ready">) => {
      if (completedRef.current[doneStage]) return;
      completedRef.current[doneStage] = true;

      const idx = STAGE_ORDER.indexOf(doneStage);
      const next = STAGE_ORDER[idx + 1];
      if (next) {
        setStage(next);
        setStageProgressState(0);
      }

      const all =
        completedRef.current.hydrating &&
        completedRef.current.connecting &&
        completedRef.current.loading_data &&
        completedRef.current.finalizing;

      if (all && !allStagesDoneRef.current) {
        allStagesDoneRef.current = true;
        completedRef.current = { ...completedRef.current };
        const finalize = () => {
          setStage("ready");
          setStageProgressState(1);
          if (minTimerFiredRef.current) {
            setIsDone(true);
          }
        };
        if (minDisplayMs <= 0) {
          finalize();
        } else {
          const elapsed = performance.now() - startedAt;
          const remaining = Math.max(0, minDisplayMs - elapsed);
          setTimeout(finalize, remaining);
        }
      }
    },
    [minDisplayMs, startedAt]
  );

  const setStageProgress = useCallback((value: number) => {
    setStageProgressState(Math.min(1, Math.max(0, value)));
  }, []);

  const reportError = useCallback((message: string) => {
    setError(message);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      minTimerFiredRef.current = true;
      if (allStagesDoneRef.current) {
        setIsDone(true);
      }
    }, Math.max(0, minDisplayMs));
    return () => clearTimeout(t);
  }, [minDisplayMs]);

  const progress = useMemo(
    () => computeProgress(stage, stageProgress),
    [stage, stageProgress]
  );

  const currentTip = useMemo(() => {
    if (error) return error;
    return STAGE_INFO[stage].tip;
  }, [stage, error]);

  const value = useMemo<SiteLoadingContextValue>(
    () => ({
      stage,
      stageProgress,
      progress,
      stagesCompleted: completedRef.current,
      error,
      isDone,
      startedAt,
      currentTip,
      markStageCompleted,
      setStageProgress,
      reportError,
    }),
    [
      stage,
      stageProgress,
      progress,
      error,
      isDone,
      startedAt,
      currentTip,
      markStageCompleted,
      setStageProgress,
      reportError,
    ]
  );

  return (
    <SiteLoadingContext.Provider value={value}>
      {children}
    </SiteLoadingContext.Provider>
  );
}
