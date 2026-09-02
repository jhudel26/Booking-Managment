import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { canManagePrice } from "@/lib/auth/permissions";
import { priceUpdateSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit";

export async function GET() {
  const supabase = await createClient();

  const { data: setting } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "booking_price_per_hour")
    .single();

  const { data: history } = await supabase
    .from("price_history")
    .select("*")
    .order("effective_from", { ascending: false })
    .limit(20);

  return NextResponse.json({
    price_per_hour: parseFloat(setting?.setting_value || "200"),
    history: history || [],
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!canManagePrice(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = priceUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const serviceClient = await createServiceClient();

  await serviceClient
    .from("system_settings")
    .upsert({
      setting_key: "booking_price_per_hour",
      setting_value: String(parsed.data.price_per_hour),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "setting_key" });

  await serviceClient.from("price_history").insert({
    price_per_hour: parsed.data.price_per_hour,
    changed_by: user.id,
  });

  await logAudit("price_changed", "system_settings", null, user.id, {
    new_price: parsed.data.price_per_hour,
  });

  return NextResponse.json({ price_per_hour: parsed.data.price_per_hour });
}
