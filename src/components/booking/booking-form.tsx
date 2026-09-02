"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bookingCreateSchema, type BookingCreateInput } from "@/lib/validation/schemas";
import { calculateTotalPrice, getBookingDuration } from "@/lib/booking/pricing";
import { formatCurrency } from "@/lib/utils";
import { formatDate, formatTime, generateTimeOptions } from "@/lib/booking/time";
import { toast } from "sonner";

interface BookingFormProps {
  date: string;
  pricePerHour: number;
  onSubmit: (data: BookingCreateInput) => Promise<void>;
  loading?: boolean;
}

export function BookingForm({ date, pricePerHour, onSubmit, loading }: BookingFormProps) {
  const timeOptions = generateTimeOptions();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingCreateInput>({
    resolver: zodResolver(bookingCreateSchema),
    defaultValues: {
      booking_date: date,
      start_time: "09:00",
      end_time: "10:00",
      requester_name: "",
      requester_contact: "",
      purpose: "",
      notes: "",
    },
  });

  const startTime = watch("start_time");
  const endTime = watch("end_time");

  useEffect(() => {
    setValue("booking_date", date);
  }, [date, setValue]);

  const duration = startTime && endTime ? getBookingDuration(startTime, endTime) : 0;
  const total = calculateTotalPrice(duration, pricePerHour);

  const handleFormSubmit = async (data: BookingCreateInput) => {
    try {
      await onSubmit(data);
      toast.success("Booking request submitted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create booking");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Booking Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Booking Date</Label>
            <Input value={formatDate(date)} disabled />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Select value={startTime} onValueChange={(v) => setValue("start_time", v)}>
                <SelectTrigger id="start_time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((t) => (
                    <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.start_time && (
                <p className="text-xs text-destructive">{errors.start_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Select value={endTime} onValueChange={(v) => setValue("end_time", v)}>
                <SelectTrigger id="end_time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.filter((t) => t > startTime).map((t) => (
                    <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.end_time && (
                <p className="text-xs text-destructive">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-semibold">{duration > 0 ? `${duration} hrs` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-semibold">{formatCurrency(pricePerHour)}/hr</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estimated Total</p>
              <p className="font-semibold text-primary">{duration > 0 ? formatCurrency(total) : "—"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requester_name">Requester Name</Label>
            <Input id="requester_name" {...register("requester_name")} />
            {errors.requester_name && (
              <p className="text-xs text-destructive">{errors.requester_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requester_contact">Contact Information</Label>
            <Input id="requester_contact" {...register("requester_contact")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input id="purpose" {...register("purpose")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={3} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || loading || duration <= 0}>
            {isSubmitting ? "Submitting..." : "Submit Booking Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
