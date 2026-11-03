import { useCallback, useEffect, useState } from "react";
import { shared } from "./shared.js";

// Read-only capability checks. Never confuse a network failure with a missing
// migration, or enable actions just by hiding the setup message.
export function useWorkflowStatus() {
  const [status, setStatus] = useState({ version: null, error: "" });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (!shared) { setStatus({ version: null, error: "Supabase is not configured" }); return; }
    let cancelled = false, pending = false;
    async function check() {
      if (pending) return;
      pending = true;
      try {
        const { data, error } = await shared.rpc("pp_signed_workflow_version");
        if (error) throw error;
        if (!Number.isInteger(data) || data < 0) throw new Error("Unexpected workflow version");
        if (!cancelled) setStatus({ version: data, error: "" });
      } catch (error) {
        if (!cancelled) setStatus({ version: null, error: error.message || "Unable to check workflow" });
      } finally { pending = false; }
    }
    check();
    const interval = setInterval(check, 15000);
    window.addEventListener("focus", check);
    return () => { cancelled = true; clearInterval(interval); window.removeEventListener("focus", check); };
  }, [revision]);
  return { ...status, refresh };
}
