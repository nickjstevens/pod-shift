<script setup lang="ts">
import { computed, ref } from "vue";

import type { ConvertSuccessResponse, ErrorResponse, PreviewResponse } from "../../../shared/types/conversion";

const props = defineProps<{
  result?: ConvertSuccessResponse | null;
  error?: ErrorResponse | null;
  preview?: PreviewResponse | null;
}>();

const copied = ref(false);

const providerLabels: Record<ConvertSuccessResponse["targetProvider"], string> = {
  apple_podcasts: "Apple Podcasts",
  pocket_casts: "Pocket Casts",
  fountain: "Fountain",
  youtube: "YouTube",
  youtube_music: "YouTube Music",
  spotify: "Spotify"
};

const badgeLabel = computed(() => {
  if (!props.result) {
    return null;
  }

  if (props.result.status === "matched_show") {
    return "Show match";
  }

  if (props.result.status === "same_app_normalized") {
    return "Already in selected app";
  }

  return "Episode match";
});

const linkLabel = computed(() => {
  if (!props.result) {
    return "";
  }

  return `Open in ${providerLabels[props.result.targetProvider]}`;
});

const retryMessage = computed(() => {
  if (!props.error) {
    return "";
  }

  if (props.error.retryable) {
    return "Try again in a moment. The resolver looks temporarily unavailable.";
  }

  if (props.error.errorCode === "low_confidence_match") {
    return "Try a different source link for the same show or episode if one is available.";
  }

  if (props.error.errorCode === "unresolved_content") {
    return "The source show or episode was identified, but the selected app did not expose a stable public link for it.";
  }

  return "Try a different supported podcast link or choose another destination app.";
});

async function copyLink() {
  if (!props.result) {
    return;
  }

  await navigator.clipboard.writeText(props.result.targetUrl);
  copied.value = true;

  window.setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <section class="panel-card conversion-output-card" aria-live="polite">
    <div class="conversion-output-card__header">
      <div>
        <p class="eyebrow">Conversion Output</p>
        <h2>Conversion Output</h2>
      </div>
      <span v-if="badgeLabel" class="pill-badge">{{ badgeLabel }}</span>
    </div>

    <template v-if="props.result">
      <p class="result-card__message">{{ props.result.message }}</p>

      <div v-if="props.preview" class="result-card__identity">
        <p class="result-card__identity-title">{{ props.preview.showTitle ?? "Resolved podcast" }}</p>
        <p v-if="props.preview.episodeTitle" class="support-copy">{{ props.preview.episodeTitle }}</p>
        <p v-if="props.preview.author" class="support-copy">{{ props.preview.author }}</p>
      </div>

      <p class="result-card__meta">
        This is the best public {{ props.result.contentKind }} link available for
        {{ providerLabels[props.result.targetProvider] }}.
      </p>

      <a
        class="result-card__url"
        :href="props.result.targetUrl"
        target="_blank"
        rel="noreferrer"
      >
        {{ props.result.targetUrl }}
      </a>

      <ul v-if="props.result.warnings.length" class="message-list">
        <li v-for="warning in props.result.warnings" :key="warning">
          {{ warning }}
        </li>
      </ul>

      <div class="action-row">
        <a
          class="primary-button action-link"
          :href="props.result.targetUrl"
          target="_blank"
          rel="noreferrer"
        >
          {{ linkLabel }}
        </a>
        <button class="secondary-button" type="button" @click="copyLink">
          {{ copied ? "Copied" : "Copy link" }}
        </button>
      </div>
    </template>

    <template v-else-if="props.error">
      <p class="conversion-output-card__issue-title">{{ props.error.message }}</p>
      <p class="support-copy">{{ retryMessage }}</p>
      <p class="support-copy">
        Error code: <code>{{ props.error.errorCode }}</code>
      </p>
    </template>

    <div v-else class="conversion-output-card__empty" aria-hidden="true"></div>
  </section>
</template>
