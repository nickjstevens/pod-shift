<script setup lang="ts">
const model = defineModel<string>({
  required: true
});

const emit = defineEmits<{
  blurred: [];
}>();

const props = defineProps<{
  disabled?: boolean;
}>();
</script>

<template>
  <div class="field-stack">
    <label class="field-label" for="podcast-link">Podcast link</label>
    <input
      id="podcast-link"
      v-model="model"
      name="inputUrl"
      :disabled="props.disabled"
      class="field-control"
      type="url"
      inputmode="url"
      placeholder="https://podcasts.apple.com/..."
      @blur="emit('blurred')"
    />
    <p class="field-help">
      Public episode and show links work best. Tracking parameters are removed before matching.
    </p>
  </div>
</template>
