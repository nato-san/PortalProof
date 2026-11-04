import assert from "node:assert/strict";
import { clientRequestMatches, clientRequestTab, creatorTab, creatorTabs, offeringMatches, sharedLanguage, sharedStatus, jobStage, jobMatches, jobStageLabel, jobStages, workspaceNavigation } from "../src/sharedView.js";
for (const tab of creatorTabs) assert.equal(creatorTab(tab), tab);
assert.equal(creatorTab("bad"), "home");
assert.equal(sharedLanguage("en"), "en");
assert.equal(sharedLanguage("ja"), "ja");
assert.equal(sharedLanguage("bad"), "ja");
const rows = [{ id: "open", active: true }, { id: "closed", active: false }];
assert.deepEqual(rows.filter(row => offeringMatches(row, "open")).map(row => row.id), ["open"]);
assert.deepEqual(rows.filter(row => offeringMatches(row, "closed")).map(row => row.id), ["closed"]);
assert.equal(sharedStatus("new", "ja"), "新着");
assert.equal(sharedStatus("new", "en"), "New");
assert.deepEqual(workspaceNavigation({ clientContext: true, clientRole: false, offeringId: "offer", requestId: null }), { showClientList: true, switchRole: "creator" });
assert.deepEqual(workspaceNavigation({ clientContext: true, clientRole: true, offeringId: null, requestId: null }), { showClientList: false, switchRole: "creator" });
assert.deepEqual(workspaceNavigation({ clientContext: false, clientRole: false, offeringId: null, requestId: null }), { showClientList: false, switchRole: "client" });
console.log("Shared view tests passed (tab selection, language and open/closed separation)");
const jobs = [
  { id: "new", workflowPhase: "negotiating" },
  { id: "approved", workflowPhase: "approved" },
  { id: "proposed", workflowPhase: "proposed" },
  { id: "agreed", workflowPhase: "agreed" },
  { id: "delivered", workflowPhase: "agreed", deliveryTxHash: "hash" },
  { id: "cancelled", workflowPhase: "cancelled", deliveryTxHash: "hash" },
  { id: "archived", workflowPhase: "agreed", archivedAt: "2026-11-03" },
];
for (const job of jobs) assert.equal(jobStages.filter(stage => jobMatches(job, stage)).length, 1);
assert.equal(jobStage(jobs[1]), "approved");
assert.equal(jobStage(jobs[2]), "approved");
assert.equal(jobStage(jobs[4]), "delivered");
assert.equal(jobStage(jobs[5]), "cancelled");
assert.equal(jobStageLabel("agreed", "ja"), "交渉済");
assert.equal(jobStageLabel("archive", "en"), "Archive");
assert.ok(jobMatches({ ...jobs[6], archivedAt: null }, "agreed"));
assert.equal(clientRequestTab("unexpected"), "active");
assert.equal(clientRequestTab("archive"), "archive");
assert.equal(clientRequestMatches({ archivedAt: null }, "active"), true);
assert.equal(clientRequestMatches({ archivedAt: "2026-11-05" }, "active"), false);
assert.equal(clientRequestMatches({ archivedAt: "2026-11-05" }, "archive"), true);
console.log("Job stage tests passed: six disjoint lists, cancellation precedence and archive restoration");
