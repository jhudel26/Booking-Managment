"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { formatDate } from "@/lib/booking/time";
import type { PriceHistory } from "@/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const [pricePerHour, setPricePerHour] = useState(200);
  const [newPrice, setNewPrice] = useState("");
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch("/api/settings/price");
      if (res.ok) {
        const data = await res.json();
        setPricePerHour(data.price_per_hour);
        setNewPrice(String(data.price_per_hour));
        setHistory(data.history || []);
      } else {
        console.error("Failed to load settings:", res.status);
        toast.error("Failed to load settings");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/price", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_per_hour: price }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update price");
      }
      toast.success("Price updated successfully");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Booking Price</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-3xl font-bold">{formatCurrency(pricePerHour)} <span className="text-base font-normal text-muted-foreground">/ hour</span></p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_price">New Price Per Hour (₱)</Label>
            <Input
              id="new_price"
              type="number"
              min="0"
              step="1"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} disabled={saving || parseFloat(newPrice) === pricePerHour}>
            {saving ? "Saving..." : "Update Price"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Changing the price only affects new bookings. Existing bookings retain their original price.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No price history available.</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <p className="font-semibold">{formatCurrency(entry.price_per_hour)}/hour</p>
                    <p className="text-xs text-muted-foreground">
                      Effective: {entry.effective_from ? formatDate(entry.effective_from) : "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
