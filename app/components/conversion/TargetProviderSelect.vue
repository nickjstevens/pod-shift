<script setup lang="ts">
import type { ProviderCapability } from "../../../shared/types/provider";

const model = defineModel<string>({
  required: true
});

const props = defineProps<{
  providers: ProviderCapability[];
  disabled?: boolean;
}>();
</script>

<template>
  <div class="field-stack">
    <label class="field-label" for="target-provider">Destination podcast app</label>
    <select
      id="target-provider"
      v-model="model"
      name="targetProvider"
      :disabled="props.disabled"
      class="field-control"
    >
      <option disabled value="">Choose an app</option>
      <option
        v-for="provider in props.providers"
        :key="provider.id"
        :value="provider.id"
      >
        {{ provider.displayName }}
      </option>
    </select>
    <p class="field-help">
      Choose where this show or episode should open. Picking the same app returns
      a cleaned public link when one is available.
    </p>
  </div>
</template>
