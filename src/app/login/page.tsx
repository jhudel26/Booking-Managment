"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { toast } from "sonner";
import { getDashboardPath } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";
import { motion } from "framer-motion";
import { Circle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!profile?.is_active) {
        await supabase.auth.signOut();
        throw new Error("Your account has been disabled");
      }

      if (!["admin", "super_admin"].includes(profile.role)) {
        await supabase.auth.signOut();
        throw new Error("You do not have admin access");
      }

      toast.success("Logged in successfully");
      router.push(getDashboardPath(profile.role as UserRole, profile));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border shadow-lg">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="p-8"
            >
              <CardHeader className="text-center pb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
                  className="mx-auto mb-4 w-12 h-12 bg-primary rounded-xl flex items-center justify-center"
                >
                  <Circle className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <CardTitle className="text-2xl font-bold">
                  Rimreserve Admin
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Sign in to manage Rimreserve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      autoComplete="email"
                      className="h-10"
                    />
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-destructive"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      autoComplete="current-password"
                      className="h-10"
                    />
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-destructive"
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </motion.div>
                </form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                  className="mt-6 text-center text-sm space-y-2"
                >
                  <Link
                    href="/forgot-password"
                    className="text-primary hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                  <p className="text-muted-foreground">
                    <Link
                      href="/"
                      className="hover:text-foreground transition-colors"
                    >
                      Back to calendar
                    </Link>
                  </p>
                </motion.div>
              </CardContent>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
