import test from "node:test";
import assert from "node:assert/strict";
import { decideQueue } from "../src/support_chat_service.ts";

test("player asset messages enter moderation while ordinary support stays in support", () => {
  const ordinary = decideQueue({ playerId: "p1", accountId: "g1", channel: "c1", message: "Where is my reward?" });
  const asset = decideQueue({ playerId: "p1", accountId: "g1", channel: "c1", message: "Please review this skin", assetId: "skin-9" });
  assert.equal(ordinary.queue, "support");
  assert.equal(asset.queue, "moderation");
});
