import type { ErrorResponse, PreviewResponse } from "../../shared/types/conversion";

export function usePreviewState() {
  const preview = ref<PreviewResponse | null>(null);
  const previewError = ref<ErrorResponse | null>(null);
  const isLoadingPreview = ref(false);
  let previewTimer: ReturnType<typeof setTimeout> | null = null;

  function clearPreview() {
    preview.value = null;
    previewError.value = null;
  }

  async function requestPreview(inputUrl: string) {
    if (!inputUrl.trim()) {
      clearPreview();
      return null;
    }

    isLoadingPreview.value = true;
    previewError.value = null;

    try {
      const response = await $fetch.raw<PreviewResponse>("/api/preview", {
        method: "POST",
        body: {
          inputUrl
        }
      });

      preview.value = response._data;
      return response._data;
    } catch (fetchError) {
      const responseError = fetchError as {
        data?: ErrorResponse;
      };

      preview.value = null;
      previewError.value =
        responseError.data ??
        ({
          errorCode: "temporary_resolution_failure",
          message: "Preview metadata could not be loaded.",
          retryable: true
        } satisfies ErrorResponse);

      return null;
    } finally {
      isLoadingPreview.value = false;
    }
  }

  function schedulePreview(inputUrl: string, delay = 250) {
    if (previewTimer) {
      clearTimeout(previewTimer);
    }

    if (!inputUrl.trim()) {
      clearPreview();
      return;
    }

    previewTimer = setTimeout(() => {
      void requestPreview(inputUrl);
    }, delay);
  }

  return {
    clearPreview,
    isLoadingPreview,
    preview,
    previewError,
    requestPreview,
    schedulePreview
  };
}
