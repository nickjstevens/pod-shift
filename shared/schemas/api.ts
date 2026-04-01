import { z } from "zod";

import { failureClasses, providerIds } from "../types/provider";

export const providerIdSchema = z.enum(providerIds);
export const failureClassSchema = z.enum(failureClasses);

export const previewRequestSchema = z.object({
  inputUrl: z.string().url()
});

export const convertRequestSchema = z.object({
  inputUrl: z.string().url(),
  targetProvider: providerIdSchema,
  preferTimestamp: z.boolean().optional().default(true)
});

export const providerCapabilitySchema = z.object({
  id: providerIdSchema,
  displayName: z.string(),
  launchState: z.enum(["enabled", "planned"]),
  supportsInput: z.boolean(),
  supportsOutput: z.boolean(),
  timestampMode: z.enum(["native", "episode_fallback", "none"]),
  notes: z.array(z.string()).default([])
});

export const previewResponseSchema = z.object({
  requestId: z.string().uuid(),
  normalizedUrl: z.string().url(),
  sourceProvider: providerIdSchema,
  contentKind: z.enum(["show", "episode", "unknown"]),
  timestampSeconds: z.number().int().nonnegative().nullable(),
  artworkUrl: z.string().url().nullable(),
  availableTargets: z.array(providerIdSchema),
  warnings: z.array(z.string())
});

export const convertSuccessResponseSchema = z.object({
  status: z.enum([
    "matched_episode",
    "matched_show",
    "fallback_episode_no_timestamp",
    "same_app_normalized"
  ]),
  sourceProvider: providerIdSchema,
  targetProvider: providerIdSchema,
  contentKind: z.enum(["show", "episode"]),
  targetUrl: z.string().url(),
  timestampApplied: z.boolean(),
  artworkUrl: z.string().url().nullable(),
  warnings: z.array(z.string()),
  message: z.string()
});

export const errorResponseSchema = z.object({
  errorCode: failureClassSchema,
  message: z.string(),
  retryable: z.boolean(),
  feedbackLogged: z.boolean()
});
