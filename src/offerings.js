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

export async function setOfferingActive(client, ownerId, id, active) {
  if (!ownerId || !id || typeof active !== "boolean") throw new Error("募集の指定が不正です / Invalid offering");
  const { data, error } = await client.from("pp_offerings")
    .update({ active }).eq("owner_id", ownerId).eq("id", id)
    .select("id,profile,active").single();
  if (error) throw error;
  if (!data) throw new Error("募集を更新できませんでした / Offering unavailable");
  return data;
}
