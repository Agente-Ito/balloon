/**
 * Express API routes for the Celebrations indexer.
 * All responses are JSON. Addresses are case-insensitive (lowercased on lookup).
 */
import { Router, type Request, type Response } from "express";
import { getBadgesForOwner, getBadgeById, getRecentBadges } from "../resolvers/badges";
import { getCardsForRecipient, getCardsBySender, getCardById, getRecentCards } from "../resolvers/greetings";
import { getDrops, getDropById, getClaimsForDrop, getDropsClaimedBy } from "../resolvers/drops";
import {
  getAllSeries, getSeriesById, createSeries,
  getSubmissionsForSeries, addSubmission, selectSubmission, reopenSubmissions,
  getSubmissionsWithVotes, castVote, removeVote,
} from "../resolvers/series";
import { createQuickGreeting, getQuickGreetingsForRecipient } from "../resolvers/quickGreetings";
import {
  createReminderSyncChallenge,
  createReminderSyncSession,
  getSyncedReminders,
  saveSyncedReminders,
  validateReminderSyncSession,
} from "../resolvers/reminderSync";
import { getDb } from "../storage/db";

const router = Router();

function getBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

// ── Health ────────────────────────────────────────────────────────────────────

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// ── Badges ────────────────────────────────────────────────────────────────────

/** GET /badges?owner=0x... */
router.get("/badges", (req: Request, res: Response) => {
  const { owner, limit } = req.query;
  if (!owner || typeof owner !== "string") {
    return res.json(getRecentBadges(Number(limit ?? 20)));
  }
  return res.json(getBadgesForOwner(owner));
});

/** GET /badges/:tokenId */
router.get("/badges/:tokenId", (req: Request, res: Response) => {
  const badge = getBadgeById(req.params.tokenId);
  if (!badge) return res.status(404).json({ error: "Badge not found" });
  return res.json(badge);
});

// ── Greeting cards ────────────────────────────────────────────────────────────

/** GET /cards?recipient=0x...  or  ?sender=0x... */
router.get("/cards", (req: Request, res: Response) => {
  const { recipient, sender, limit } = req.query;
  if (recipient && typeof recipient === "string") {
    return res.json(getCardsForRecipient(recipient));
  }
  if (sender && typeof sender === "string") {
    return res.json(getCardsBySender(sender));
  }
  return res.json(getRecentCards(Number(limit ?? 20)));
});

/** GET /cards/:tokenId */
router.get("/cards/:tokenId", (req: Request, res: Response) => {
  const card = getCardById(req.params.tokenId);
  if (!card) return res.status(404).json({ error: "Card not found" });
  return res.json(card);
});

// ── Quick greetings (off-chain social) ──────────────────────────────────────

/** GET /quick-greetings?recipient=0x...&limit=20 */
router.get("/quick-greetings", (req: Request, res: Response) => {
  const { recipient, limit } = req.query;
  if (!recipient || typeof recipient !== "string") {
    return res.status(400).json({ error: "recipient param required" });
  }
  return res.json(getQuickGreetingsForRecipient(recipient, Number(limit ?? 25)));
});

/** POST /quick-greetings { sender, recipient, reaction, message? } */
router.post("/quick-greetings", (req: Request, res: Response) => {
  const { sender, recipient, reaction, message } = req.body as Record<string, unknown>;
  if (!sender || !recipient || !reaction) {
    return res.status(400).json({ error: "sender, recipient and reaction are required" });
  }
  try {
    const created = createQuickGreeting({
      sender: String(sender),
      recipient: String(recipient),
      reaction: String(reaction),
      message: message ? String(message) : undefined,
    });
    return res.status(201).json(created);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith("QuickGreetingRateLimited:")) {
      const retryAfterSeconds = Number(msg.split(":")[1] ?? "0");
      return res.status(429).json({ error: "QuickGreetingRateLimited", retryAfterSeconds });
    }
    return res.status(400).json({ error: msg });
  }
});

// ── Social graph ──────────────────────────────────────────────────────────────

/** GET /followers/:address — latest follow state inferred from events */
router.get("/followers/:address", (req: Request, res: Response) => {
  const addr = req.params.address.toLowerCase();
  const db = getDb();

  // Followers: addresses that last action toward `addr` was "follow"
  const rows = db.prepare(`
    SELECT DISTINCT follower,
      (SELECT action FROM follow_events
       WHERE follower = fe.follower AND followed = ?
       ORDER BY block_number DESC LIMIT 1) AS last_action
    FROM follow_events fe
    WHERE followed = ?
  `).all(addr, addr) as { follower: string; last_action: string }[];

  const followers = rows.filter((r) => r.last_action === "follow").map((r) => r.follower);
  return res.json({ address: addr, followers, count: followers.length });
});

/** GET /following/:address */
router.get("/following/:address", (req: Request, res: Response) => {
  const addr = req.params.address.toLowerCase();
  const db = getDb();

  const rows = db.prepare(`
    SELECT DISTINCT followed,
      (SELECT action FROM follow_events
       WHERE follower = ? AND followed = fe.followed
       ORDER BY block_number DESC LIMIT 1) AS last_action
    FROM follow_events fe
    WHERE follower = ?
  `).all(addr, addr) as { followed: string; last_action: string }[];

  const following = rows.filter((r) => r.last_action === "follow").map((r) => r.followed);
  return res.json({ address: addr, following, count: following.length });
});

// ── Drops ─────────────────────────────────────────────────────────────────────

/**
 * GET /drops
 *   ?host=0x...         → drops created by this address (most recent first)
 *   ?active=true        → only drops with an open window and available supply
 *   ?month=4&day=20     → drops scheduled on this calendar date
 *   ?following=0x,0x    → drops from a comma-separated list of followed addresses
 *   ?claimer=0x...      → drops claimed by this address (returns claim records)
 *   ?limit=N            → cap results (default 50)
 */
router.get("/drops", (req: Request, res: Response) => {
  const { host, active, month, day, following, claimer, limit } = req.query;

  // Special case: drops claimed by an address
  if (claimer && typeof claimer === "string") {
    return res.json(getDropsClaimedBy(claimer));
  }

  const followingList =
    following && typeof following === "string"
      ? following.split(",").map((a) => a.trim()).filter(Boolean)
      : undefined;

  const drops = getDrops({
    host:       host && typeof host === "string" ? host : undefined,
    activeOnly: active === "true",
    month:      month ? Number(month) : undefined,
    day:        day   ? Number(day)   : undefined,
    following:  followingList,
    limit:      limit ? Number(limit) : 50,
  });

  return res.json(drops);
});

/** GET /drops/:dropId — full drop detail */
router.get("/drops/:dropId", (req: Request, res: Response) => {
  const drop = getDropById(req.params.dropId);
  if (!drop) return res.status(404).json({ error: "Drop not found" });
  return res.json(drop);
});

/** GET /drops/:dropId/claims — list of claimers for a drop */
router.get("/drops/:dropId/claims", (req: Request, res: Response) => {
  return res.json(getClaimsForDrop(req.params.dropId));
});

// ── Social calendar ───────────────────────────────────────────────────────────

/**
 * GET /social-calendar?viewer=0x...
 *
 * Returns profiles that `viewer` follows, plus their birthday/anniversary dates,
 * filtered by visibility (public always shown; followers shown if viewer follows them).
 * Also returns active drops from those profiles for the given date range.
 *
 * Query params:
 *   viewer=0x...   (required) the connected user's address
 *   month=N        (optional) filter by calendar month (1–12)
 */
router.get("/social-calendar", (req: Request, res: Response) => {
  const { viewer, month } = req.query;
  if (!viewer || typeof viewer !== "string") {
    return res.status(400).json({ error: "viewer param required" });
  }
  const viewerAddr = viewer.toLowerCase();
  const db = getDb();

  // Get all addresses that viewer follows (current state from follow_events)
  const followingRows = db.prepare(`
    SELECT DISTINCT followed,
      (SELECT action FROM follow_events
       WHERE follower = ? AND followed = fe.followed
       ORDER BY block_number DESC LIMIT 1) AS last_action
    FROM follow_events fe
    WHERE follower = ?
  `).all(viewerAddr, viewerAddr) as { followed: string; last_action: string }[];

  const following = followingRows
    .filter((r) => r.last_action === "follow")
    .map((r) => r.followed);

  if (following.length === 0) {
    return res.json({ profiles: [], drops: [] });
  }

  const reminderWindowDays = (frequency: string): number => {
    if (frequency === "daily") return 1;
    if (frequency === "weekly") return 7;
    return 30;
  };

  const daysUntilBirthday = (month: number, day: number): number => {
    const now = new Date();
    const thisYear = now.getFullYear();
    const target = new Date(thisYear, month - 1, day);
    if (target < now) target.setFullYear(thisYear + 1);
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Get profile dates for followed addresses — respect visibility
  // public: always visible; followers: visible if viewer follows them (they're in `following`)
  const placeholders = following.map(() => "?").join(", ");
  const profileRows = db.prepare(`
    SELECT address, birthday_month, birthday_day, up_created_at, birthday_vis, notify_followers, reminder_frequency
    FROM profiles
    WHERE address IN (${placeholders})
      AND birthday_vis IN ('public', 'followers')
      AND birthday_month IS NOT NULL
  `).all(...following) as {
    address: string;
    birthday_month: number;
    birthday_day: number;
    up_created_at: number | null;
    birthday_vis: string;
    notify_followers: number;
    reminder_frequency: string;
  }[];

  const profiles = profileRows
    .filter((p) =>
      p.birthday_vis === "public" ||
      (p.birthday_vis === "followers" && following.includes(p.address))
    )
    .map((p) => ({
      address: p.address,
      birthdayMonth: p.birthday_month,
      birthdayDay: p.birthday_day,
      upCreatedAt: p.up_created_at,
      notifyFollowers: p.notify_followers === 1,
      reminderFrequency: (p.reminder_frequency === "weekly" || p.reminder_frequency === "daily")
        ? p.reminder_frequency
        : "monthly",
      reminderDueSoon:
        p.notify_followers === 1 &&
        daysUntilBirthday(p.birthday_month, p.birthday_day) <= reminderWindowDays(p.reminder_frequency),
    }));

  // Also include active drops from followed profiles
  const dropMonth = month ? Number(month) : undefined;
  const drops = getDrops({
    following,
    activeOnly: true,
    month: dropMonth,
    limit: 100,
  });

  return res.json({ profiles, drops });
});

// ── Reminder backup / restore (off-chain, signature-gated) ─────────────────

router.post("/reminder-sync/challenge", (req: Request, res: Response) => {
  const { profileAddress, signerAddress } = req.body as Record<string, unknown>;
  if (!profileAddress || !signerAddress) {
    return res.status(400).json({ error: "profileAddress and signerAddress are required" });
  }

  return res.json(createReminderSyncChallenge(String(profileAddress).toLowerCase() as `0x${string}`, String(signerAddress).toLowerCase() as `0x${string}`));
});

router.post("/reminder-sync/session", async (req: Request, res: Response) => {
  const { challengeId, signature } = req.body as Record<string, unknown>;
  if (!challengeId || !signature) {
    return res.status(400).json({ error: "challengeId and signature are required" });
  }

  try {
    const session = await createReminderSyncSession(String(challengeId), String(signature) as `0x${string}`);
    return res.status(201).json(session);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith("ReminderSync")) {
      return res.status(401).json({ error: msg });
    }
    return res.status(500).json({ error: msg });
  }
});

router.get("/reminder-sync/reminders", (req: Request, res: Response) => {
  const { profile } = req.query;
  if (!profile || typeof profile !== "string") {
    return res.status(400).json({ error: "profile query param required" });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "ReminderSyncMissingToken" });
  }

  const session = validateReminderSyncSession(token, profile.toLowerCase() as `0x${string}`);
  if (!session) {
    return res.status(401).json({ error: "ReminderSyncInvalidSession" });
  }

  return res.json(getSyncedReminders(profile.toLowerCase() as `0x${string}`) ?? {
    profileAddress: profile.toLowerCase(),
    reminders: [],
    updatedAt: 0,
    updatedBy: session.signer_address,
  });
});

router.put("/reminder-sync/reminders", (req: Request, res: Response) => {
  const { profileAddress, reminders } = req.body as Record<string, unknown>;
  if (!profileAddress || !Array.isArray(reminders)) {
    return res.status(400).json({ error: "profileAddress and reminders[] are required" });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "ReminderSyncMissingToken" });
  }

  const normalizedProfile = String(profileAddress).toLowerCase() as `0x${string}`;
  const session = validateReminderSyncSession(token, normalizedProfile);
  if (!session) {
    return res.status(401).json({ error: "ReminderSyncInvalidSession" });
  }

  return res.json(saveSyncedReminders(normalizedProfile, reminders, session.signer_address));
});

// ── Drop series ───────────────────────────────────────────────────────────────

/**
 * GET /series              → list all series
 * POST /series             → create a series  { id, name, description?, celebrationType?, month, day, curator }
 */
router.get("/series", (_req: Request, res: Response) => {
  return res.json(getAllSeries());
});

router.post("/series", (req: Request, res: Response) => {
  const { id, name, description, celebrationType, month, day, curator } = req.body as Record<string, unknown>;
  if (!id || !name || !month || !day || !curator) {
    return res.status(400).json({ error: "id, name, month, day, curator are required" });
  }
  if (getSeriesById(id as string)) {
    return res.status(409).json({ error: "Series id already exists" });
  }
  try {
    const series = createSeries({
      id: id as string,
      name: name as string,
      description: description as string | undefined,
      celebrationType: celebrationType ? Number(celebrationType) : undefined,
      month: Number(month),
      day: Number(day),
      curator: curator as string,
    });
    return res.status(201).json(series);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

/** GET /series/:id                → series detail */
router.get("/series/:id", (req: Request, res: Response) => {
  const series = getSeriesById(req.params.id);
  if (!series) return res.status(404).json({ error: "Series not found" });
  return res.json(series);
});

/**
 * GET /series/:id/submissions?viewer=0x...
 * Returns submissions with vote counts. If viewer is provided, votedByViewer is set.
 */
router.get("/series/:id/submissions", (req: Request, res: Response) => {
  if (!getSeriesById(req.params.id)) {
    return res.status(404).json({ error: "Series not found" });
  }
  const viewer = req.query.viewer && typeof req.query.viewer === "string"
    ? req.query.viewer
    : undefined;
  return res.json(getSubmissionsWithVotes(req.params.id, viewer));
});

/**
 * POST /series/:id/submissions
 * Body: { artist, imageIPFS, message? }
 */
router.post("/series/:id/submissions", (req: Request, res: Response) => {
  const series = getSeriesById(req.params.id);
  if (!series) return res.status(404).json({ error: "Series not found" });
  if (!series.submissionOpen) {
    return res.status(409).json({ error: "Submissions are closed for this series" });
  }
  const { artist, imageIPFS, message } = req.body as Record<string, unknown>;
  if (!artist || !imageIPFS) {
    return res.status(400).json({ error: "artist and imageIPFS are required" });
  }
  try {
    const submission = addSubmission({
      seriesId: req.params.id,
      artist: artist as string,
      imageIPFS: imageIPFS as string,
      message: message as string | undefined,
    });
    return res.status(201).json(submission);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

/**
 * PUT /series/:id/select/:submissionId
 * Curator selects the winning submission. Body: { dropId? } (optional link to drop)
 */
router.put("/series/:id/select/:submissionId", (req: Request, res: Response) => {
  const series = getSeriesById(req.params.id);
  if (!series) return res.status(404).json({ error: "Series not found" });
  const { dropId } = req.body as { dropId?: string };
  try {
    selectSubmission(req.params.id, Number(req.params.submissionId), dropId);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

/**
 * PUT /series/:id/reopen
 * Curator re-opens submissions for the next cycle.
 */
router.put("/series/:id/reopen", (req: Request, res: Response) => {
  if (!getSeriesById(req.params.id)) {
    return res.status(404).json({ error: "Series not found" });
  }
  reopenSubmissions(req.params.id);
  return res.json({ ok: true });
});

/**
 * POST /series/:id/vote
 * Body: { submissionId: number, voter: string }
 * Casts (or changes) the voter's vote for this series.
 */
router.post("/series/:id/vote", (req: Request, res: Response) => {
  const series = getSeriesById(req.params.id);
  if (!series) return res.status(404).json({ error: "Series not found" });
  if (!series.submissionOpen) {
    return res.status(409).json({ error: "Submissions are closed for this series" });
  }
  const { submissionId, voter } = req.body as Record<string, unknown>;
  if (!submissionId || !voter) {
    return res.status(400).json({ error: "submissionId and voter are required" });
  }
  try {
    castVote(req.params.id, Number(submissionId), voter as string);
    const submissions = getSubmissionsWithVotes(req.params.id, voter as string);
    return res.json({ ok: true, submissions });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

/**
 * DELETE /series/:id/vote
 * Body: { voter: string }
 * Removes the voter's vote for this series.
 */
router.delete("/series/:id/vote", (req: Request, res: Response) => {
  const series = getSeriesById(req.params.id);
  if (!series) return res.status(404).json({ error: "Series not found" });
  const { voter } = req.body as Record<string, unknown>;
  if (!voter) {
    return res.status(400).json({ error: "voter is required" });
  }
  try {
    removeVote(req.params.id, voter as string);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// ── Indexer state ─────────────────────────────────────────────────────────────

/** GET /status — last indexed blocks per listener */
router.get("/status", (_req: Request, res: Response) => {
  const rows = getDb().prepare("SELECT listener, last_block, updated_at FROM indexer_state").all();
  return res.json(rows);
});

export { router };
