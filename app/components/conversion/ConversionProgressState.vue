<script setup lang="ts">
import type { PreviewResponse } from "../../../shared/types/conversion";

import ArtworkPreviewCard from "./ArtworkPreviewCard.vue";

defineProps<{
  preview: PreviewResponse | null;
}>();
</script>

<template>
  <section class="panel-card progress-card" aria-live="polite">
    <div class="progress-card__header">
      <div class="progress-card__spinner" aria-hidden="true"></div>
      <div>
        <p class="eyebrow">Matching in progress</p>
        <h2>Matching link...</h2>
        <p class="support-copy">Resolving the closest show or episode match.</p>
      </div>
    </div>

    <ArtworkPreviewCard v-if="preview" :preview="preview" />
  </section>
</template>
