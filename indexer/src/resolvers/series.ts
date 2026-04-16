/**
 * DB helpers for drop series and submissions.
 */
import { getDb } from "../storage/db";

export interface DropSeries {
  id: string;
  name: string;
  description: string | null;
  celebrationType: number;
  month: number;
  day: number;
  curator: string;
  submissionOpen: boolean;
  selectedDropId: string | null;
  votingDeadline: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SeriesSubmission {
  id: number;
  seriesId: string;
  artist: string;
  imageIPFS: string;
  message: string | null;
  selected: boolean;
  submittedAt: number;
}

function rowToSeries(r: Record<string, unknown>): DropSeries {
  return {
    id:             r.id as string,
    name:           r.name as string,
    description:    r.description as string | null,
    celebrationType: r.celebration_type as number,
    month:          r.month as number,
    day:            r.day as number,
    curator:        r.curator as string,
    submissionOpen: Boolean(r.submission_open),
    selectedDropId: r.selected_drop_id as string | null,
    votingDeadline: r.voting_deadline as number | null ?? null,
    createdAt:      r.created_at as number,
    updatedAt:      r.updated_at as number,
  };
}

function rowToSubmission(r: Record<string, unknown>): SeriesSubmission {
  return {
    id:          r.id as number,
    seriesId:    r.series_id as string,
    artist:      r.artist as string,
    imageIPFS:   r.image_ipfs as string,
    message:     r.message as string | null,
    selected:    Boolean(r.selected),
    submittedAt: r.submitted_at as number,
  };
}

export function getAllSeries(): DropSeries[] {
  const rows = getDb()
    .prepare("SELECT * FROM drop_series ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToSeries);
}

export function getSeriesById(id: string): DropSeries | null {
  const row = getDb()
    .prepare("SELECT * FROM drop_series WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToSeries(row) : null;
}

export function createSeries(params: {
  id: string;
  name: string;
  description?: string;
  celebrationType?: number;
  month: number;
  day: number;
  curator: string;
}): DropSeries {
  const db = getDb();
  db.prepare(`
    INSERT INTO drop_series (id, name, description, celebration_type, month, day, curator)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    params.id,
    params.name,
    params.description ?? null,
    params.celebrationType ?? 3,
    params.month,
    params.day,
    params.curator.toLowerCase(),
  );
  return getSeriesById(params.id)!;
}

export function getSubmissionsForSeries(seriesId: string): SeriesSubmission[] {
  const rows = getDb()
    .prepare(`
      SELECT ss.*, COUNT(sv.id) AS vote_count
      FROM series_submissions ss
      LEFT JOIN series_votes sv ON sv.submission_id = ss.id AND sv.series_id = ss.series_id
      WHERE ss.series_id = ?
      GROUP BY ss.id
      ORDER BY vote_count DESC, ss.submitted_at DESC
    `)
    .all(seriesId) as Record<string, unknown>[];
  return rows.map(rowToSubmission);
}

export function addSubmission(params: {
  seriesId: string;
  artist: string;
  imageIPFS: string;
  message?: string;
}): SeriesSubmission {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO series_submissions (series_id, artist, image_ipfs, message)
    VALUES (?, ?, ?, ?)
  `).run(params.seriesId, params.artist.toLowerCase(), params.imageIPFS, params.message ?? null);

  const row = db
    .prepare("SELECT * FROM series_submissions WHERE id = ?")
    .get(result.lastInsertRowid) as Record<string, unknown>;
  return rowToSubmission(row);
}

export function selectSubmission(
  seriesId: string,
  submissionId: number,
  dropId?: string
): void {
  const db = getDb();
  // Mark all submissions for this series as not-selected, then pick the winner
  db.prepare("UPDATE series_submissions SET selected = 0 WHERE series_id = ?").run(seriesId);
  db.prepare("UPDATE series_submissions SET selected = 1 WHERE id = ? AND series_id = ?")
    .run(submissionId, seriesId);
  db.prepare(`
    UPDATE drop_series
    SET submission_open = 0, selected_drop_id = ?, updated_at = unixepoch()
    WHERE id = ?
  `).run(dropId ?? null, seriesId);
}

export function reopenSubmissions(seriesId: string): void {
  getDb().prepare(`
    UPDATE drop_series
    SET submission_open = 1, selected_drop_id = NULL, updated_at = unixepoch()
    WHERE id = ?
  `).run(seriesId);
}

// ── Voting ────────────────────────────────────────────────────────────────────

export interface SubmissionWithVotes extends SeriesSubmission {
  voteCount: number;
  votedByViewer: boolean;
}

function rowToSubmissionWithVotes(r: Record<string, unknown>): SubmissionWithVotes {
  const base = rowToSubmission(r);
  return {
    ...base,
    voteCount: r.vote_count as number ?? 0,
    votedByViewer: r.viewer_voted as number === 1,
  };
}

export function getSubmissionsWithVotes(seriesId: string, viewer?: string): SubmissionWithVotes[] {
  const viewerAddr = viewer ? viewer.toLowerCase() : null;
  const rows = getDb()
    .prepare(`
      SELECT ss.*,
        COUNT(sv.id) AS vote_count,
        MAX(CASE WHEN sv.voter = ? THEN 1 ELSE 0 END) AS viewer_voted
      FROM series_submissions ss
      LEFT JOIN series_votes sv ON sv.submission_id = ss.id AND sv.series_id = ss.series_id
      WHERE ss.series_id = ?
      GROUP BY ss.id
      ORDER BY vote_count DESC, ss.submitted_at DESC
    `)
    .all(viewerAddr, seriesId) as Record<string, unknown>[];
  return rows.map((r) => rowToSubmissionWithVotes(r));
}

export function castVote(seriesId: string, submissionId: number, voter: string): void {
  getDb().prepare(`
    INSERT INTO series_votes (series_id, submission_id, voter)
    VALUES (?, ?, ?)
    ON CONFLICT(series_id, voter) DO UPDATE SET
      submission_id = excluded.submission_id,
      voted_at = unixepoch()
  `).run(seriesId, submissionId, voter.toLowerCase());
}

export function removeVote(seriesId: string, voter: string): void {
  getDb().prepare(
    "DELETE FROM series_votes WHERE series_id = ? AND voter = ?"
  ).run(seriesId, voter.toLowerCase());
}

export function getVoterChoice(seriesId: string, voter: string): number | null {
  const row = getDb()
    .prepare("SELECT submission_id FROM series_votes WHERE series_id = ? AND voter = ?")
    .get(seriesId, voter.toLowerCase()) as { submission_id: number } | undefined;
  return row ? row.submission_id : null;
}
