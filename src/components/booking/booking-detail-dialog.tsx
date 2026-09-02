"use client";

import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { formatDate, formatTimeRange } from "@/lib/booking/time";
import type { Booking } from "@/types";
import { useState } from "react";

interface BookingDetailDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuperAdmin?: boolean;
  onApprove?: (id: string, reason?: string) => Promise<void>;
  onReject?: (id: string, reason?: string) => Promise<void>;
  onCancel?: (id: string, reason?: string) => Promise<void>;
}

export function BookingDetailDialog({
  booking,
  open,
  onOpenChange,
  isSuperAdmin,
  onApprove,
  onReject,
  onCancel,
}: BookingDetailDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const handleAction = async (action: "approve" | "reject" | "cancel") => {
    setLoading(true);
    try {
      if (action === "approve" && onApprove) await onApprove(booking.id, reason);
      if (action === "reject" && onReject) await onReject(booking.id, reason);
      if (action === "cancel" && onCancel) await onCancel(booking.id, reason);
      onOpenChange(false);
      setReason("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reservation #{booking.booking_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <StatusBadge status={booking.status} />
          </div>

          <Separator />

          <DetailRow label="Date" value={booking.booking_date ? formatDate(booking.booking_date) : "N/A"} />
          <DetailRow label="Time" value={formatTimeRange(booking.start_time, booking.end_time)} />
          <DetailRow label="Duration" value={`${booking.duration_hours} hours`} />
          <DetailRow label="Price" value={`${formatCurrency(booking.price_per_hour)}/hour`} />
          <DetailRow label="Total" value={formatCurrency(booking.total_price)} />
          <DetailRow label="Requester" value={booking.requester_name} />
          {booking.requester_contact && (
            <DetailRow label="Contact" value={booking.requester_contact} />
          )}
          {booking.purpose && <DetailRow label="Purpose" value={booking.purpose} />}
          {booking.notes && <DetailRow label="Notes" value={booking.notes} />}
          <DetailRow label="Created" value={booking.created_at ? formatDate(booking.created_at) : "N/A"} />

          {isSuperAdmin && booking.status === "pending" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="reason">Note / Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add a note for this action..."
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        {isSuperAdmin && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {booking.status === "pending" && (
              <>
                <Button
                  variant="success"
                  onClick={() => handleAction("approve")}
                  disabled={loading}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAction("reject")}
                  disabled={loading}
                >
                  Reject
                </Button>
              </>
            )}
            {(booking.status === "pending" || booking.status === "approved") && (
              <Button
                variant="outline"
                onClick={() => handleAction("cancel")}
                disabled={loading}
              >
                Cancel Reservation
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
