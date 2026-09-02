"use client";

import { useEffect } from "react";
import { AppLoadingScreen } from "./app-loading-screen";
import { useSiteLoading } from "@/components/providers/site-status-provider";

interface HydrationLoaderProps {
  children: React.ReactNode;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function HydrationLoader({ children }: HydrationLoaderProps) {
  const {
    isDone,
    progress,
    stage,
    currentTip,
    markStageCompleted,
    setStageProgress,
    reportError,
  } = useSiteLoading();

  useEffect(() => {
    let cancelled = false;

    async function runBootChecks() {
      try {
        await sleep(120);
        if (cancelled) return;
        markStageCompleted("hydrating");

        setStageProgress(0.15);

        const pricePromise = fetch("/api/settings/price", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Settings API: HTTP ${res.status}`);
          const data = await res.json().catch(() => ({}));
          if (typeof data.price_per_hour !== "number") {
            throw new Error("Settings API returned invalid price data");
          }
          return data as { price_per_hour: number; history: unknown[] };
        });

        for (let i = 0; i < 4; i++) {
          await sleep(90);
          if (cancelled) return;
          setStageProgress(0.15 + (i + 1) * 0.18);
        }

        await pricePromise;
        if (cancelled) return;
        markStageCompleted("connecting");

        setStageProgress(0.1);

        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const todayStr = `${y}-${m}-${d}`;

        const bookingsPromise = fetch(
          `/api/bookings?date=${encodeURIComponent(todayStr)}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        ).then(async (res) => {
          if (!res.ok) throw new Error(`Bookings API: HTTP ${res.status}`);
          const data = await res.json().catch(() => []);
          if (!Array.isArray(data)) {
            throw new Error("Bookings API returned non-array response");
          }
          return data;
        });

        for (let i = 0; i < 5; i++) {
          await sleep(90);
          if (cancelled) return;
          setStageProgress(0.1 + (i + 1) * 0.17);
        }

        await bookingsPromise;
        if (cancelled) return;
        markStageCompleted("loading_data");

        setStageProgress(0.2);
        await sleep(160);
        if (cancelled) return;
        setStageProgress(0.6);
        await sleep(140);
        if (cancelled) return;
        setStageProgress(1);
        await sleep(80);
        if (cancelled) return;

        markStageCompleted("finalizing");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unable to reach Rimreserve services";
        reportError(msg);
        markStageCompleted("connecting");
        markStageCompleted("loading_data");
        markStageCompleted("finalizing");
      }
    }

    runBootChecks();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <AppLoadingScreen
        show={!isDone}
        realProgress={progress}
        realStage={stage}
        realTip={currentTip}
      />
      {!isDone ? <div aria-hidden style={{ visibility: "hidden" }}>{children}</div> : children}
    </>
  );
}
