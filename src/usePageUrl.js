import { useEffect, useState } from "react";

export function usePageUrl() {
  const [href, setHref] = useState(() => globalThis.location?.href || "https://example.com/");
  useEffect(() => {
    const update = () => setHref(location.href);
    window.addEventListener("popstate", update);
    window.addEventListener("pageshow", update);
    return () => { window.removeEventListener("popstate", update); window.removeEventListener("pageshow", update); };
  }, []);
  return new URL(href);
}
