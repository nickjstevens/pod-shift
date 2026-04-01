import type { ConvertSuccessResponse, ErrorResponse, ProvidersResponse } from "../../shared/types/conversion";
import type { ProviderCapability } from "../../shared/types/provider";

export function useConversionFlow(
  initialProviders: ProviderCapability[] = [],
  options?: {
    beforeConvert?: (inputUrl: string) => Promise<void>;
  }
) {
  const inputUrl = ref("");
  const targetProvider = ref("");
  const providers = ref<ProviderCapability[]>(initialProviders);
  const isLoadingProviders = ref(false);
  const isSubmitting = ref(false);
  const result = ref<ConvertSuccessResponse | null>(null);
  const error = ref<ErrorResponse | null>(null);

  if (!targetProvider.value && providers.value.length) {
    const preferredProvider =
      providers.value.find((provider) => provider.id === "pocket_casts") ?? providers.value[0];
    targetProvider.value = preferredProvider.id;
  }

  async function loadProviders() {
    isLoadingProviders.value = true;

    try {
      const response = await $fetch<ProvidersResponse>("/api/providers");
      providers.value = response.providers.filter((provider) => provider.supportsOutput);

      if (!targetProvider.value && providers.value.length) {
        const preferredProvider =
          providers.value.find((provider) => provider.id === "pocket_casts") ?? providers.value[0];
        targetProvider.value = preferredProvider.id;
      }
    } finally {
      isLoadingProviders.value = false;
    }
  }

  async function submitConversion(overrides?: {
    inputUrl?: string;
    targetProvider?: string;
  }) {
    const requestInputUrl = overrides?.inputUrl ?? inputUrl.value;
    const requestTargetProvider = overrides?.targetProvider ?? targetProvider.value;

    inputUrl.value = requestInputUrl;
    targetProvider.value = requestTargetProvider;
    isSubmitting.value = true;
    result.value = null;
    error.value = null;

    try {
      if (options?.beforeConvert) {
        await options.beforeConvert(requestInputUrl);
      }

      const [response] = await Promise.all([
        $fetch.raw<ConvertSuccessResponse>("/api/convert", {
          method: "POST",
          body: {
            inputUrl: requestInputUrl,
            targetProvider: requestTargetProvider,
            preferTimestamp: true
          }
        }),
        new Promise((resolve) => {
          setTimeout(resolve, 350);
        })
      ]);

      result.value = response._data;
    } catch (fetchError) {
      const responseError = fetchError as {
        data?: ErrorResponse;
      };

      error.value =
        responseError.data ??
        ({
          errorCode: "temporary_resolution_failure",
          message: "The conversion request could not be completed.",
          retryable: true
        } satisfies ErrorResponse);
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    error,
    inputUrl,
    isLoadingProviders,
    isSubmitting,
    loadProviders,
    providers,
    result,
    submitConversion,
    targetProvider
  };
}
