<script setup lang="ts">
import ConversionResultCard from "../components/conversion/ConversionResultCard.vue";
import ConversionProgressState from "../components/conversion/ConversionProgressState.vue";
import ConversionErrorState from "../components/conversion/ConversionErrorState.vue";
import ArtworkPreviewCard from "../components/conversion/ArtworkPreviewCard.vue";
import LinkInputForm from "../components/conversion/LinkInputForm.vue";
import TargetProviderSelect from "../components/conversion/TargetProviderSelect.vue";
import type { ProvidersResponse } from "../../shared/types/conversion";

const { data: providersData } = await useFetch<ProvidersResponse>("/api/providers");
const initialProviders = providersData.value?.providers.filter((provider) => provider.supportsOutput) ?? [];
const conversionForm = ref<HTMLFormElement | null>(null);
const isReady = ref(false);
const { preview, requestPreview, schedulePreview } = usePreviewState();

const {
  error,
  inputUrl,
  isLoadingProviders,
  isSubmitting,
  loadProviders,
  providers,
  result,
  submitConversion,
  targetProvider
} = useConversionFlow(initialProviders, {
  beforeConvert: async (currentInputUrl) => {
    await requestPreview(currentInputUrl);
  }
});

onMounted(() => {
  isReady.value = true;

  if (!providers.value.length) {
    void loadProviders();
  }
});

watch(inputUrl, (value) => {
  if (!isReady.value) {
    return;
  }

  schedulePreview(value);
});

function handleSubmit(event: Event) {
  const form = event.currentTarget as HTMLFormElement;
  submitForm(form);
}

function handleButtonClick() {
  if (!conversionForm.value) {
    return;
  }

  submitForm(conversionForm.value);
}

function submitForm(form: HTMLFormElement) {
  const formData = new FormData(form);

  const submittedInputUrl = String(formData.get("inputUrl") ?? "");
  const submittedTargetProvider = String(formData.get("targetProvider") ?? "");

  void submitConversion({
    inputUrl: submittedInputUrl,
    targetProvider: submittedTargetProvider
  });
}
</script>

<template>
  <main class="page-shell">
    <section class="hero-panel">
      <p class="eyebrow">Cross-app podcast links</p>
      <h1>Paste the link you got. Open it in the podcast app you actually use.</h1>
      <p class="hero-copy">
        Pod Shift normalizes public podcast links, strips tracking noise, and
        sends you to the same show or episode in another player.
      </p>
    </section>

    <section class="conversion-layout">
      <form
        ref="conversionForm"
        class="panel-card conversion-panel"
        :aria-busy="isSubmitting"
        @submit.prevent="handleSubmit"
      >
        <LinkInputForm v-model="inputUrl" :disabled="!isReady || isSubmitting" />
        <TargetProviderSelect
          v-model="targetProvider"
          :providers="providers"
          :disabled="!isReady || isSubmitting || isLoadingProviders"
        />

        <button
          class="primary-button"
          type="button"
          :disabled="!isReady || isSubmitting || !targetProvider"
          @click="handleButtonClick"
        >
          {{ isSubmitting ? "Converting..." : "Convert link" }}
        </button>

        <p class="field-help">No account required.</p>
      </form>

      <aside class="panel-card support-panel">
        <p class="eyebrow">Supported apps</p>
        <h2>Available destinations</h2>
        <p class="support-copy">
          Pod Shift returns the closest public show or episode link it can verify
          for the app you choose.
        </p>

        <ul class="provider-pill-list">
          <li v-for="provider in providers" :key="provider.id">
            {{ provider.displayName }}
          </li>
        </ul>
      </aside>
    </section>

    <ConversionProgressState v-if="isSubmitting" :preview="preview" />

    <ConversionResultCard v-else-if="result" :result="result" />

    <ConversionErrorState v-else-if="error" :error="error" />

    <ArtworkPreviewCard v-else-if="preview" :preview="preview" />
  </main>
</template>
