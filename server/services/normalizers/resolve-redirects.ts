const redirectHosts = new Set(["bit.ly", "tinyurl.com", "pod.link", "link.chtbl.com"]);

export async function resolveRedirects(input: string | URL) {
  const url = typeof input === "string" ? new URL(input) : new URL(input.toString());
  if (!redirectHosts.has(url.hostname)) {
    return url;
  }

  const response = await fetch(url, {
    method: "HEAD",
    redirect: "follow"
  });

  return new URL(response.url);
}
