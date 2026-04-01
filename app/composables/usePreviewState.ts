import type { ErrorResponse, PreviewResponse } from "../../shared/types/conversion";

export function usePreviewState() {
  const preview = ref<PreviewResponse | null>(null);
  const previewError = ref<ErrorResponse | null>(null);
  const isLoadingPreview = ref(false);
  const lastRequestedInputUrl = ref("");
  let activeRequestToken = 0;

  function clearPreview() {
    activeRequestToken += 1;
    preview.value = null;
    previewError.value = null;
    isLoadingPreview.value = false;
    lastRequestedInputUrl.value = "";
  }

  function handleInputChanged(inputUrl: string) {
    if (inputUrl.trim() === lastRequestedInputUrl.value.trim()) {
      return;
    }

    activeRequestToken += 1;
    preview.value = null;
    previewError.value = null;
    isLoadingPreview.value = false;
  }

  async function requestPreview(inputUrl: string) {
    const trimmedInputUrl = inputUrl.trim();

    if (!trimmedInputUrl) {
      clearPreview();
      return null;
    }

    const requestToken = ++activeRequestToken;
    isLoadingPreview.value = true;
    previewError.value = null;
    lastRequestedInputUrl.value = trimmedInputUrl;

    try {
      const response = await $fetch.raw<PreviewResponse>("/api/preview", {
        method: "POST",
        body: {
          inputUrl: trimmedInputUrl
        }
      });

      if (requestToken !== activeRequestToken) {
        return null;
      }

      preview.value = response._data;
      return response._data;
    } catch (fetchError) {
      if (requestToken !== activeRequestToken) {
        return null;
      }

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
      if (requestToken === activeRequestToken) {
        isLoadingPreview.value = false;
      }
    }
  }

  return {
    clearPreview,
    handleInputChanged,
    isLoadingPreview,
    preview,
    previewError,
    requestPreview
  };
}
