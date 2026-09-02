import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { canManageUsers } from "@/lib/auth/permissions";
import { createAdminSchema } from "@/lib/validation/schemas";
import { logAudit } from "@/lib/audit";

export async function GET() {
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

  if (!canManageUsers(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("profiles")
    .select("*")
    .in("role", ["admin", "super_admin"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
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

  if (!canManageUsers(profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createAdminSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.role === "super_admin") {
    return NextResponse.json(
      { error: "Cannot create Super Admin via API" },
      { status: 403 }
    );
  }

  const serviceClient = await createServiceClient();

  const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name, role: "admin" },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  await serviceClient
    .from("profiles")
    .update({ role: "admin", full_name: parsed.data.full_name, is_active: true })
    .eq("id", authUser.user.id);

  await logAudit("user_created", "profile", authUser.user.id, user.id, {
    email: parsed.data.email,
    role: "admin",
  });

  return NextResponse.json({ id: authUser.user.id, email: parsed.data.email }, { status: 201 });
}
