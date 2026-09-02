import { createServiceClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/types";

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  performedBy: string | null,
  details: Record<string, unknown> = {}
) {
  try {
    const supabase = await createServiceClient();
    await supabase.from("audit_logs").insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      performed_by: performedBy,
      details,
    });
  } catch {
    console.error("Failed to write audit log");
  }
}

export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*, performer:profiles!audit_logs_performed_by_fkey(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as AuditLog[]) || [];
}
