// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";

import ConversionOutputCard from "@root/app/components/conversion/ConversionOutputCard.vue";
import type { ConvertSuccessResponse, ErrorResponse, PreviewResponse } from "@root/shared/types/conversion";

describe("ConversionOutputCard", () => {
  const preview: PreviewResponse = {
    requestId: "00000000-0000-0000-0000-000000000010",
    normalizedUrl: "https://podcasts.apple.com/us/podcast/test-show/id1000000000?i=1000000001",
    sourceProvider: "apple_podcasts",
    contentKind: "episode",
    previewLevel: "episode",
    showTitle: "Test Show",
    episodeTitle: "Test Episode",
    author: "Test Publisher",
    timestampSeconds: null,
    artworkUrl: null,
    availableTargets: ["pocket_casts"],
    warnings: []
  };

  const successResult: ConvertSuccessResponse = {
    status: "matched_episode",
    sourceProvider: "apple_podcasts",
    targetProvider: "pocket_casts",
    contentKind: "episode",
    targetUrl: "https://pca.st/episode/test-episode",
    timestampApplied: true,
    artworkUrl: null,
    warnings: ["Timestamp was preserved from the source link."],
    message: "Matched the same episode in Pocket Casts."
  };

  const unresolvedError: ErrorResponse = {
    errorCode: "unresolved_content",
    message: "The selected app does not expose a stable link for this content.",
    retryable: false
  };

  it("renders a blank output shell while idle", () => {
    const wrapper = mount(ConversionOutputCard);

    expect(wrapper.get("h2").text()).toBe("Conversion Output");
    expect(wrapper.find(".conversion-output-card__empty").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Copy link");
  });

  it("renders the merged success content inside the output card", () => {
    const wrapper = mount(ConversionOutputCard, {
      props: {
        result: successResult,
        preview
      }
    });

    expect(wrapper.text()).toContain("Episode match");
    expect(wrapper.text()).toContain("Matched the same episode in Pocket Casts.");
    expect(wrapper.text()).toContain("Test Show");
    expect(wrapper.text()).toContain("Test Episode");
    expect(wrapper.text()).toContain("Timestamp was preserved from the source link.");
    expect(wrapper.get(".result-card__url").attributes("href")).toBe("https://pca.st/episode/test-episode");
    expect(wrapper.get(".action-link").text()).toBe("Open in Pocket Casts");
  });

  it("renders issue details and retry guidance inside the output card", () => {
    const wrapper = mount(ConversionOutputCard, {
      props: {
        error: unresolvedError
      }
    });

    expect(wrapper.text()).toContain("The selected app does not expose a stable link for this content.");
    expect(wrapper.text()).toContain(
      "The source show or episode was identified, but the selected app did not expose a stable public link for it."
    );
    expect(wrapper.text()).toContain("Error code: unresolved_content");
  });
});
