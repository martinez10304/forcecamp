import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables, // required by @convex-dev/auth (users, sessions, accounts, etc.)

  progress: defineTable({
    userId: v.id("users"),
    xp: v.number(),
    answered: v.number(),
    correct: v.number(),
    best: v.number(),
    cleared: v.record(v.string(), v.union(v.literal("hit"), v.literal("miss"))),
    stats: v.record(v.string(), v.object({ r: v.number(), w: v.number() })),
    misses: v.array(v.number()),
    mocks: v.array(v.object({ at: v.number(), correct: v.number(), total: v.number() })),
    // optional: added after the table already had rows. New fields going forward
    // should default to optional here too, so existing documents stay valid without
    // a migration — `progress.get` merges DEFAULTS over whatever the row is missing.
    bestSurvival: v.optional(v.number()),
    dailyStreak: v.optional(v.number()),
    lastDaily: v.optional(v.union(v.string(), v.null())),
    bestPlinko: v.optional(v.number()),
  }).index("by_user", ["userId"]),
});
