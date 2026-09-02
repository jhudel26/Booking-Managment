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
  LineChart,
  Line,
} from "recharts";
import { motion } from "framer-motion";
import { Circle } from "lucide-react";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [pricePerHour, setPricePerHour] = useState(200);

  const loadData = async () => {
    try {
      const [statsRes, bookingsRes, priceRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/bookings"),
        fetch("/api/settings/price"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        setPricePerHour(priceData.price_per_hour);
      }
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

  // Generate booking overview chart data (monthly bookings)
  const generateOverviewData = () => {
    const monthlyData: Record<string, number> = {};
    bookings.forEach((booking) => {
      const month = booking.booking_date.substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });
    
    return Object.entries(monthlyData)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  const overviewData = generateOverviewData();

  // Today's bookings data
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.booking_date === today);
  const todayChartData = todayBookings.map((booking) => ({
    time: booking.start_time,
    name: booking.requester_name,
    status: booking.status,
  }));

  const pendingBookings = bookings.filter((b) => b.status === "pending").slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Circle className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <StatCard title="Total Bookings" value={stats?.total || 0} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <StatCard title="Pending" value={stats?.pending || 0} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <StatCard title="Approved" value={stats?.approved || 0} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <StatCard title="Rejected" value={stats?.rejected || 0} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats?.revenue || 0)}
            description="From approved bookings"
          />
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border bg-card p-6 shadow-lg"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Booking Status Overview
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border bg-card p-6 shadow-lg"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Bookings Overview (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="url(#lineGradient)" strokeWidth={2} dot={{ fill: "#2563eb" }} />
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border bg-card p-6 shadow-lg"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Today's Bookings
          </h3>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Current Rate: {formatCurrency(pricePerHour)}/hr</p>
            <p className="text-sm text-muted-foreground">Effective: Sep 2, 2026</p>
          </div>
          {todayBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No bookings today</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {todayBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between p-2 border rounded hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{booking.requester_name}</p>
                    <p className="text-xs text-muted-foreground">{booking.start_time} - {booking.end_time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    booking.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                  }`}>
                    {booking.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
        {pendingBookings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending reservations.</p>
        ) : (
          <BookingTable
            bookings={pendingBookings}
            onView={setSelectedBooking}
          />
        )}
      </motion.div>

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        isSuperAdmin
        onApprove={(id, reason) => handleAction(id, "approve", reason)}
        onReject={(id, reason) => handleAction(id, "reject", reason)}
        onCancel={(id, reason) => handleAction(id, "cancel", reason)}
      />
    </motion.div>
  );
}
