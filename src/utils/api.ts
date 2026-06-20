import { publicAnonKey } from "/utils/supabase/info";

const API_BASE = window.location.origin + "/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiCall(path: string, opts: RequestInit = {}, token?: string) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token || publicAnonKey}`,
      ...(opts.headers as Record<string, string> || {}),
    };
    
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    
    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      data = { error: `Failed to parse response (HTTP ${res.status})` };
    }

    if (!res.ok) {
      const errorMessage = data.error || data.message || `Request failed (HTTP ${res.status})`;
      throw new ApiError(errorMessage, res.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "An unexpected error occurred",
      500
    );
  }
}
