"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { BookingTable } from "@/components/booking/booking-table";
import { BookingDetailDialog } from "@/components/booking/booking-detail-dialog";
import { Button } from "@/components/ui/button";
import { ContentLoader } from "@/components/ui/content-loader";
import type { Booking } from "@/types";
import { Calendar, Circle } from "lucide-react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/bookings?mine=true");
        if (res.ok) setBookings(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pending = bookings.filter((b) => b.status === "pending").length;
  const approved = bookings.filter((b) => b.status === "approved").length;
  const rejected = bookings.filter((b) => b.status === "rejected").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  const pieData = [
    { name: "Pending", value: pending, color: "#f59e0b" },
    { name: "Approved", value: approved, color: "#10b981" },
    { name: "Rejected", value: rejected, color: "#ef4444" },
    { name: "Cancelled", value: cancelled, color: "#6b7280" },
  ].filter((item) => item.value > 0);

  if (loading) {
    return <ContentLoader label="Loading your dashboard..." size="md" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Circle className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            Rimreserve
          </h1>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/admin/calendar">
            <Calendar className="h-4 w-4 mr-2" />
            New Reservation
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
          <StatCard title="My Reservations" value={bookings.length} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
          <StatCard title="Pending" value={pending} />
        </motion.div>
        <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.15 }}>
          <StatCard title="Approved" value={approved} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.15 }}
          className="rounded-lg border bg-card p-6 shadow-sm"
        >
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Reservation Status Distribution
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No reservation data available</p>
          )}
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.15 }}
        >
          <h2 className="text-lg font-semibold mb-4">Recent Reservations</h2>
          <BookingTable
            bookings={bookings.slice(0, 10)}
            onView={setSelectedBooking}
          />
        </motion.div>
      </motion.div>

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      />
    </motion.div>
  );
}
