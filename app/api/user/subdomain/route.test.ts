import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { NextRequest } from "next/server";

let ownerId: string | undefined;
let viewerId: string | undefined;

mock.module("@/lib/db", {
  namedExports: {
    db: { query: { users: { findFirst: async () => ownerId ? { id: ownerId } : undefined } } },
  },
});
mock.module("@/lib/auth/session", {
  namedExports: {
    getServerSession: async () => viewerId ? { user: { id: viewerId } } : null,
    requireAuth: async () => {
      if (!viewerId) throw new Error("Unauthorized");
      return { user: { id: viewerId } };
    },
  },
});
const { GET } = await import("./route");

async function checkAvailability() {
  const response = await GET(new NextRequest("https://ugc.community/api/user/subdomain?check=creator-example"));
  assert.equal(response.status, 200);
  return response.json();
}

test("a creator can keep their saved subdomain when updating their portfolio", async () => {
  ownerId = "creator-1";
  viewerId = "creator-1";
  const result = await checkAvailability();
  assert.equal(result.available, true);
  assert.equal(result.normalized, "creator-example");
});

test("another creator cannot use an occupied subdomain", async () => {
  ownerId = "creator-1";
  viewerId = "creator-2";
  const result = await checkAvailability();
  assert.equal(result.available, false);
  assert.equal(result.reason, "Already taken");
});

test("anonymous checks do not expose an occupied subdomain as available", async () => {
  ownerId = "creator-1";
  viewerId = undefined;
  assert.equal((await checkAvailability()).available, false);
});

test("unclaimed subdomains remain available without signing in", async () => {
  ownerId = undefined;
  viewerId = undefined;
  assert.equal((await checkAvailability()).available, true);
});
