"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookingTable } from "@/components/booking/booking-table";
import { BookingDetailDialog } from "@/components/booking/booking-detail-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { Booking, DashboardStats } from "@/types";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const loadData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/bookings"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAction = async (id: string, action: string, reason?: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || `Failed to ${action} booking`);
      return;
    }

    toast.success(`Booking ${action}d successfully`);
    await loadData();
    setSelectedBooking(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Pending", value: stats?.pending || 0 },
    { name: "Approved", value: stats?.approved || 0 },
    { name: "Rejected", value: stats?.rejected || 0 },
    { name: "Cancelled", value: stats?.cancelled || 0 },
  ];

  const pendingBookings = bookings.filter((b) => b.status === "pending").slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={stats?.total || 0} />
        <StatCard title="Pending" value={stats?.pending || 0} />
        <StatCard title="Approved" value={stats?.approved || 0} />
        <StatCard title="Rejected" value={stats?.rejected || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue || 0)}
          description="From approved bookings"
        />

        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Booking Status Overview
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Pending Approvals</h2>
        {pendingBookings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending bookings.</p>
        ) : (
          <BookingTable
            bookings={pendingBookings}
            onView={setSelectedBooking}
          />
        )}
      </div>

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        isSuperAdmin
        onApprove={(id, reason) => handleAction(id, "approve", reason)}
        onReject={(id, reason) => handleAction(id, "reject", reason)}
        onCancel={(id, reason) => handleAction(id, "cancel", reason)}
      />
    </div>
  );
}
