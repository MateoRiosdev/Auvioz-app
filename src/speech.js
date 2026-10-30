import { languages } from "./i18n.js";
export function initialLanguage() {
  try {
    const saved = localStorage.getItem("auvioz-language");
    if (languages.some((l) => l.code === saved)) return saved;
  } catch {
    /* Storage can be unavailable. */
  }
  for (const candidate of navigator.languages || [navigator.language]) {
    const base = candidate.toLowerCase().split("-")[0];
    if (languages.some((l) => l.code === base)) return base;
  }
  return "en";
}
export function selectVoice(voices, language, uri) {
  const matches = voices.filter(
    (v) => v.lang.toLowerCase().split(/[-_]/)[0] === language,
  );
  return (
    matches.find((v) => v.voiceURI === uri) ||
    matches.find(
      (v) =>
        /jorge|diego|carlos|miguel|pablo|male\b/i.test(v.name) &&
        !/female/i.test(v.name),
    ) ||
    matches.find((v) => v.default) ||
    matches[0]
  );
}
