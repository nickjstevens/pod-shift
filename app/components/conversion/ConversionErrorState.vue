<script setup lang="ts">
import { computed } from "vue";

import type { ErrorResponse } from "../../../shared/types/conversion";

const props = defineProps<{
  error: ErrorResponse;
}>();

const retryMessage = computed(() => {
  if (props.error.retryable) {
    return "Try again in a moment. The resolver looks temporarily unavailable.";
  }

  if (props.error.errorCode === "low_confidence_match") {
    return "Try a different source link for the same show or episode if one is available.";
  }

  return "Try a different supported podcast link or choose another destination app.";
});
</script>

<template>
  <section class="panel-card error-panel" aria-live="polite">
    <p class="eyebrow">Conversion issue</p>
    <h2>{{ props.error.message }}</h2>
    <p class="support-copy">{{ retryMessage }}</p>
    <p class="support-copy">
      Error code: <code>{{ props.error.errorCode }}</code>
    </p>
  </section>
</template>
