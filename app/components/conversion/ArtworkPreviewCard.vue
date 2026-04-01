<script setup lang="ts">
import { computed } from "vue";

import type { PreviewResponse } from "../../../shared/types/conversion";

const props = defineProps<{
  preview?: PreviewResponse | null;
  pending?: boolean;
}>();

const previewLevelLabel = computed(() => {
  switch (props.preview?.previewLevel) {
    case "episode":
      return "Episode-level match detected.";
    case "show":
      return "Show-level match detected.";
    default:
      return "Matching details are still being confirmed.";
  }
});
</script>

<template>
  <section class="panel-card preview-card" aria-live="polite">
    <p class="eyebrow">Podcast preview</p>
    <h2>Podcast preview</h2>

    <div class="preview-card__body">
      <img
        v-if="props.preview?.artworkUrl"
        :src="props.preview.artworkUrl"
        alt="Podcast artwork"
        class="preview-card__artwork"
      />
      <div v-else class="preview-card__placeholder">
        Artwork preview is not available yet.
      </div>

      <div class="preview-card__details">
        <template v-if="props.preview">
          <p class="preview-card__title">{{ props.preview.showTitle ?? "Resolving podcast details" }}</p>
          <p v-if="props.preview.episodeTitle" class="preview-card__episode">{{ props.preview.episodeTitle }}</p>
          <p v-if="props.preview.author" class="preview-card__author">{{ props.preview.author }}</p>
          <p class="support-copy">{{ previewLevelLabel }}</p>
          <p class="support-copy">
            Source: <code>{{ props.preview.sourceProvider }}</code>
          </p>
          <p class="support-copy">
            Preview: <code>{{ props.preview.previewLevel }}</code>
          </p>
        </template>

        <template v-else-if="props.pending">
          <div class="preview-card__skeleton preview-card__skeleton--title"></div>
          <div class="preview-card__skeleton preview-card__skeleton--line"></div>
          <div class="preview-card__skeleton preview-card__skeleton--line"></div>
        </template>

        <ul v-if="props.preview?.warnings.length" class="message-list">
          <li v-for="warning in props.preview.warnings" :key="warning">
            {{ warning }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
