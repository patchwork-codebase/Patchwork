import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../app/components/auth/AuthContext";

export interface ExpertApplication {
  id?: string;
  user_id?: string;
  status?: "draft" | "pending" | "approved" | "rejected";
  domains: string[];
  headline: string;
  bio: string;
  years_experience?: number | null;
  job_title?: string;
  company?: string;
  past_companies?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  website?: string;
  public_work?: string;
  reason?: string;
  monthly_review_capacity?: number | null;
  timezone?: string;
  languages?: string[];
  verification_level?: string;
  submitted_at?: string | null;
  rejected_at?: string | null;
  created_at?: string;
}

export function useExpertApplication(userId: string | undefined) {
  return useQuery({
    queryKey: ["expert-application", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("expert_applications")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["draft", "pending", "approved", "rejected"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ExpertApplication | null;
    },
    enabled: !!userId,
  });
}

export function useSaveExpertApplication(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      payload,
      submit,
    }: {
      payload: Partial<ExpertApplication>;
      submit?: boolean;
    }) => {
      if (!userId) throw new Error("Not authenticated");

      // Check if there's an existing draft
      const { data: existing } = await supabase
        .from("expert_applications")
        .select("id, status")
        .eq("user_id", userId)
        .in("status", ["draft"])
        .maybeSingle();

      const record: Partial<ExpertApplication> & { user_id: string } = {
        ...payload,
        user_id: userId,
        status: submit ? "pending" : "draft",
        updated_at: new Date().toISOString(),
        ...(submit ? { submitted_at: new Date().toISOString() } : {}),
      } as any;

      if (existing?.id) {
        const { error } = await supabase
          .from("expert_applications")
          .update(record)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("expert_applications")
          .insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expert-application", userId] });
    },
  });
}
