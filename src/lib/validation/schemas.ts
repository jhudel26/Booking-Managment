import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const bookingCreateSchema = z
  .object({
    booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time"),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time"),
    requester_name: z.string().min(1, "Requester name is required").max(200),
    requester_contact: z.string().max(200).optional(),
    purpose: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export const bookingUpdateSchema = z.object({
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  requester_name: z.string().min(1).max(200).optional(),
  requester_contact: z.string().max(200).optional(),
  purpose: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
});

export const bookingActionSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const createAdminSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Name is required").max(200),
  role: z.enum(["admin", "super_admin"]),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  role: z.enum(["user", "admin", "super_admin"]).optional(),
  is_active: z.boolean().optional(),
  can_create_admin: z.boolean().optional(),
  can_approve_bookings: z.boolean().optional(),
  can_manage_rates: z.boolean().optional(),
});

export const priceUpdateSchema = z.object({
  price_per_hour: z.number().min(0, "Price must be positive").max(1000000),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type PriceUpdateInput = z.infer<typeof priceUpdateSchema>;
