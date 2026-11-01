import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const shared = url && key ? createClient(url, key) : null;
export async function sharedRpc(name, params) {
  if (!shared) throw new Error("Supabase未設定 / Supabase is not configured");
  const { data, error } = await shared.rpc(name, params);
  if (error) throw error;
  if (!data) throw new Error("情報が見つかりません / Information unavailable");
  return data;
}
export function privateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2,"0")).join("");
}
