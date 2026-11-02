export function offeringUrl(base, id) {
  const url = new URL(base);
  url.search = "";
  url.hash = "";
  url.searchParams.set("view", "shared");
  url.searchParams.set("offering", id);
  return url.href;
}

// The explicit filter supplements server-side RLS; it does not replace it.
export async function loadCreatorOfferings(client, ownerId) {
  if (!ownerId) throw new Error("ログインが必要です / Sign in first");
  const { data, error } = await client.from("pp_offerings")
    .select("id,profile,active").eq("owner_id", ownerId).order("id");
  if (error) throw error;
  return data || [];
}
