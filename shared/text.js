export function normalizeText(text, clean) {
  return clean
    ? text
        .normalize("NFKC")
        .replace(/\.{2,}|…/gu, ". ")
        .replace(/[^\p{L}\p{M}\p{N}\s.,!?;:。！？、，؛؟।]/gu, " ")
        .replace(/\s+/gu, " ")
        .trim()
    : text.trim();
}
