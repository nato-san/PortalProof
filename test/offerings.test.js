import assert from "node:assert/strict";
import { loadCreatorOfferings, offeringUrl, setOfferingActive, synchronizeOfferingWallets } from "../src/offerings.js";
assert.equal(offeringUrl("https://example.com/PortalProof/?access=secret#private", "one"), "https://example.com/PortalProof/?view=shared&offering=one");
const rows = [{ id: "one", profile: { serviceName: "Icon" }, active: true }, { id: "two", profile: { serviceName: "Portrait" }, active: true }];
const calls = [];
const client = { from(table) { calls.push(table); return {
  select(columns) { calls.push(columns); return this; },
  eq(column, value) { calls.push([column, value]); return this; },
  async order(column) { calls.push(column); return { data: rows, error: null }; },
}; } };
assert.deepEqual(await loadCreatorOfferings(client, "creator-a"), rows);
assert.deepEqual(calls, ["pp_offerings", "id,profile,active", ["owner_id", "creator-a"], "id"]);
await assert.rejects(loadCreatorOfferings(client, ""), /ログイン/);
const failing = { from() { return { select() { return this; }, eq() { return this; }, async order() { return { error: new Error("denied") }; } }; } };
await assert.rejects(loadCreatorOfferings(failing, "creator-b"), /denied/);
console.log("Offering loader tests passed (multiple rows, owner filter, private URL removal, errors)");
for (const active of [false, true]) {
  const updates = [];
  const updating = { from(table) { updates.push(table); return {
    update(patch) { updates.push(patch); return this; },
    eq(key, value) { updates.push([key, value]); return this; },
    select() { return this; },
    async single() { return { data: { id: "one", active }, error: null }; },
  }; } };
  assert.equal((await setOfferingActive(updating, "creator-a", "one", active)).active, active);
  assert.deepEqual(updates, ["pp_offerings", { active }, ["owner_id", "creator-a"], ["id", "one"]]);
}
await assert.rejects(setOfferingActive(client, "", "one", false), /不正/);
await assert.rejects(setOfferingActive(client, "creator-a", "one", "false"), /不正/);
const deniedUpdate = { from() { return {
  update() { return this; }, eq() { return this; }, select() { return this; },
  async single() { return { error: new Error("permission denied") }; },
}; } };
await assert.rejects(setOfferingActive(deniedUpdate, "creator-b", "one", false), /permission denied/);
console.log("Offering close/reopen tests passed (owner/id filters, active-only updates and rejection)");

{
  const sourceRows = [
    { id: "one", profile: { serviceName: "A", creatorWallet: "0x0000000000000000000000000000000000000001" }, active: true },
    { id: "two", profile: { serviceName: "B", creatorWallet: "0x2222222222222222222222222222222222222222" }, active: true },
  ];
  const updates = [];
  const syncing = { from() { return {
    select() { return this; },
    eq(key, value) {
      if (key === "owner_id" && this.patch) updates.push([this.patch, key, value]);
      return this;
    },
    async order() { return { data: sourceRows, error: null }; },
    update(patch) { this.patch = patch; return this; },
    then(resolve) { resolve({ error: null }); },
  }; } };
  const count = await synchronizeOfferingWallets(syncing, "creator-a", "0x2222222222222222222222222222222222222222");
  assert.equal(count, 1);
  assert.deepEqual(updates[0], [{ profile: { serviceName: "A", creatorWallet: "0x2222222222222222222222222222222222222222" } }, "owner_id", "creator-a"]);
}
await assert.rejects(synchronizeOfferingWallets(client, "creator-a", "bad"), /ウォレット/);
console.log("Offering wallet synchronization tests passed (verified wallet replaces stale manual value)");
