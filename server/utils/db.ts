import { randomUUID } from "node:crypto";

import { Pool } from "pg";

import type { FeedbackEvent } from "../../shared/types/conversion";
import { readRuntimeConfig } from "./runtime-config";

type MemoryStore = {
  feedbackEvents: FeedbackEvent[];
};

declare global {
  // eslint-disable-next-line no-var
  var __podShiftMemoryStore__: MemoryStore | undefined;
  // eslint-disable-next-line no-var
  var __podShiftPgPool__: Pool | undefined;
}

function getMemoryStore(): MemoryStore {
  globalThis.__podShiftMemoryStore__ ??= {
    feedbackEvents: []
  };

  return globalThis.__podShiftMemoryStore__;
}

export function getFeedbackEvents() {
  return [...getMemoryStore().feedbackEvents];
}

export function resetFeedbackEvents() {
  getMemoryStore().feedbackEvents = [];
}

function getPool() {
  const config = readRuntimeConfig();
  if (!config.databaseUrl) {
    return null;
  }

  globalThis.__podShiftPgPool__ ??= new Pool({
    connectionString: config.databaseUrl
  });

  return globalThis.__podShiftPgPool__;
}

export async function insertFeedbackEvent(event: Omit<FeedbackEvent, "feedbackEventId" | "createdAt">) {
  const feedbackEvent: FeedbackEvent = {
    ...event,
    feedbackEventId: randomUUID(),
    createdAt: new Date().toISOString()
  };
  const config = readRuntimeConfig();

  if (config.feedbackStore === "postgres") {
    const pool = getPool();
    if (!pool) {
      throw new Error("DATABASE_URL is required when POD_SHIFT_FEEDBACK_STORE=postgres");
    }

    await pool.query(
      `insert into feedback_events (
        feedback_event_id,
        attempt_id,
        source_provider_id,
        target_provider_id,
        failure_class,
        normalized_identity_hash,
        confidence_bucket,
        stripped_tracking_keys,
        created_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        feedbackEvent.feedbackEventId,
        feedbackEvent.attemptId,
        feedbackEvent.sourceProviderId,
        feedbackEvent.targetProviderId,
        feedbackEvent.failureClass,
        feedbackEvent.normalizedIdentityHash,
        feedbackEvent.confidenceBucket,
        feedbackEvent.strippedTrackingKeys,
        feedbackEvent.createdAt
      ]
    );

    return feedbackEvent;
  }

  getMemoryStore().feedbackEvents.push(feedbackEvent);
  return feedbackEvent;
}
