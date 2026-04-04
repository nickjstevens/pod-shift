<script setup lang="ts">
import ArtworkPreviewCard from "../components/conversion/ArtworkPreviewCard.vue";
import ConversionOutputCard from "../components/conversion/ConversionOutputCard.vue";
import LinkInputForm from "../components/conversion/LinkInputForm.vue";
import TargetProviderSelect from "../components/conversion/TargetProviderSelect.vue";
import type { ProvidersResponse } from "../../shared/types/conversion";

const { data: providersData } = await useFetch<ProvidersResponse>("/api/providers");
const initialProviders = providersData.value?.providers.filter((provider) => provider.supportsOutput) ?? [];
const conversionForm = ref<HTMLFormElement | null>(null);
const isReady = ref(false);
const skipBlurPreview = ref(false);
const { handleInputChanged, isLoadingPreview, preview, previewError, requestPreview } = usePreviewState();

const {
  clearOutcome,
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

  handleInputChanged(value);
  clearOutcome();
});

const outputError = computed(() => {
  if (isSubmitting.value || result.value) {
    return null;
  }

  return error.value ?? previewError.value;
});

function handleSubmit(event: Event) {
  const form = event.currentTarget as HTMLFormElement;
  submitForm(form);
}

function handleButtonClick() {
  if (!conversionForm.value) {
    return;
  }

  skipBlurPreview.value = false;
  submitForm(conversionForm.value);
}

function markSubmitIntent() {
  skipBlurPreview.value = true;
}

function handleInputBlur() {
  window.setTimeout(() => {
    if (skipBlurPreview.value) {
      skipBlurPreview.value = false;
      return;
    }

    if (!isReady.value || isSubmitting.value) {
      return;
    }

    void requestPreview(inputUrl.value);
  }, 0);
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
        <LinkInputForm
          v-model="inputUrl"
          :disabled="!isReady || isSubmitting"
          @blurred="handleInputBlur"
        />

        <ArtworkPreviewCard
          v-if="preview || isLoadingPreview"
          :preview="preview"
          :pending="isLoadingPreview"
        />

        <TargetProviderSelect
          v-model="targetProvider"
          :providers="providers"
          :disabled="!isReady || isSubmitting || isLoadingProviders"
        />

        <div class="conversion-actions">
          <button
            class="primary-button"
            type="button"
            :disabled="!isReady || isSubmitting || !targetProvider"
            @pointerdown="markSubmitIntent"
            @click="handleButtonClick"
          >
            Convert link
          </button>

          <div
            v-if="isSubmitting"
            class="conversion-actions__status"
            role="status"
            aria-live="polite"
          >
            <span class="conversion-actions__spinner" aria-hidden="true"></span>
            <span>Searching</span>
          </div>
        </div>

        <ConversionOutputCard
          :result="result"
          :error="outputError"
          :preview="preview"
        />
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

    <aside class="panel-card support-panel support-panel--mobile">
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
  </main>
</template>
