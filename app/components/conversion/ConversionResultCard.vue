<script setup lang="ts">
import { computed, ref } from "vue";

import type { ConvertSuccessResponse, PreviewResponse } from "../../../shared/types/conversion";

const props = defineProps<{
  result: ConvertSuccessResponse;
  preview?: PreviewResponse | null;
}>();

const copied = ref(false);

const providerLabels: Record<ConvertSuccessResponse["targetProvider"], string> = {
  apple_podcasts: "Apple Podcasts",
  pocket_casts: "Pocket Casts",
  fountain: "Fountain",
  overcast: "Overcast",
  youtube: "YouTube",
  youtube_music: "YouTube Music",
  spotify: "Spotify",
  castbox: "Castbox"
};

const badgeLabel = computed(() => {
  if (props.result.status === "matched_show") {
    return "Show match";
  }

  if (props.result.status === "same_app_normalized") {
    return "Already in selected app";
  }

  return "Episode match";
});

const linkLabel = computed(() => `Open in ${providerLabels[props.result.targetProvider]}`);

async function copyLink() {
  await navigator.clipboard.writeText(props.result.targetUrl);
  copied.value = true;

  window.setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <section class="panel-card result-card" aria-live="polite">
    <div class="result-card__header">
      <div>
        <p class="eyebrow">Converted link</p>
        <h2>Converted link</h2>
      </div>
      <span class="pill-badge">{{ badgeLabel }}</span>
    </div>

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
  </section>
</template>
