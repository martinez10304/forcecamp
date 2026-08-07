import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULTS = {
  xp: 0, answered: 0, correct: 0, best: 0, cleared: {}, stats: {}, misses: [], mocks: [],
  bestSurvival: 0, dailyStreak: 0, lastDaily: null, bestPlinko: 0,
};

// Security model: every function derives the caller's id server-side via
// getAuthUserId(ctx) and only ever reads/writes that user's own row. Never
// accept a client-supplied userId — that would be the Convex equivalent of
// disabling Postgres RLS.

export const get = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = await ctx.db
      .query("progress")
      .withIndex("by_user", q => q.eq("userId", userId))
      .unique();
    if (!row) return { ...DEFAULTS, _isDefault: true }; // no row yet -> client offers local import
    return { ...DEFAULTS, ...row }; // fills in any fields added after this row was created
  },
});

export const save = mutation({
  args: {
    xp: v.number(),
    answered: v.number(),
    correct: v.number(),
    best: v.number(),
    cleared: v.record(v.string(), v.union(v.literal("hit"), v.literal("miss"))),
    stats: v.record(v.string(), v.object({ r: v.number(), w: v.number() })),
    misses: v.array(v.number()),
    mocks: v.array(v.object({ at: v.number(), correct: v.number(), total: v.number() })),
    bestSurvival: v.number(),
    dailyStreak: v.number(),
    lastDaily: v.union(v.string(), v.null()),
    bestPlinko: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");
    const existing = await ctx.db
      .query("progress")
      .withIndex("by_user", q => q.eq("userId", userId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert("progress", { userId, ...args });
  },
});
