const removableTrackingKeys = new Set([
  "feature",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "si",
  "utm_campaign",
  "utm_content",
  "utm_id",
  "utm_medium",
  "utm_source",
  "utm_term"
]);

export function stripTrackingParameters(input: string | URL) {
  const url = typeof input === "string" ? new URL(input) : new URL(input.toString());
  const strippedTrackingKeys: string[] = [];
  const preservedEntries = [...url.searchParams.entries()]
    .filter(([key]) => {
      const keep = !removableTrackingKeys.has(key);
      if (!keep) {
        strippedTrackingKeys.push(key);
      }

      return keep;
    })
    .sort(([left], [right]) => left.localeCompare(right));

  url.hash = "";
  url.search = "";

  for (const [key, value] of preservedEntries) {
    url.searchParams.append(key, value);
  }

  return {
    normalizedUrl: url.toString(),
    strippedTrackingKeys
  };
}
