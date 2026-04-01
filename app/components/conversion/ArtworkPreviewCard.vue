<script setup lang="ts">
import type { PreviewResponse } from "../../../shared/types/conversion";

defineProps<{
  preview: PreviewResponse;
}>();
</script>

<template>
  <section class="panel-card preview-card" aria-live="polite">
    <p class="eyebrow">Podcast preview</p>
    <h2>Podcast preview</h2>

    <div class="preview-card__body">
      <img
        v-if="preview.artworkUrl"
        :src="preview.artworkUrl"
        alt="Podcast artwork"
        class="preview-card__artwork"
      />
      <div v-else class="preview-card__placeholder">
        Artwork preview is not available yet.
      </div>

      <div class="preview-card__details">
        <p class="support-copy">
          {{ preview.contentKind === "episode" ? "Episode-level match detected." : "Show-level match detected." }}
        </p>
        <p class="support-copy">
          Source: <code>{{ preview.sourceProvider }}</code>
        </p>
        <ul v-if="preview.warnings.length" class="message-list">
          <li v-for="warning in preview.warnings" :key="warning">
            {{ warning }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
