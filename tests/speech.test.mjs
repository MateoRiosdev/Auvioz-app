import test from "node:test";
import assert from "node:assert/strict";
import { initialLanguage, selectVoice } from "../src/speech.js";
test("locale respects saved preference then browser language order", () => {
  globalThis.localStorage = { getItem: () => null };
  Object.defineProperty(globalThis, "navigator", {
    value: { languages: ["xx-XX", "es-PE", "en-US"] },
    configurable: true,
  });
  assert.equal(initialLanguage(), "es");
  globalThis.localStorage.getItem = () => "fr";
  assert.equal(initialLanguage(), "fr");
  globalThis.localStorage.getItem = () => "unknown";
  navigator.languages = ["en-GB"];
  assert.equal(initialLanguage(), "en");
  globalThis.localStorage.getItem = () => {
    throw Error();
  };
  navigator.languages = ["ko"];
  assert.equal(initialLanguage(), "en");
});
test("voice selection preserves explicit choice and never crosses language", () => {
  const voices = [
    { name: "Lucia", lang: "es-ES", voiceURI: "f" },
    { name: "Jorge", lang: "es-MX", voiceURI: "m" },
    { name: "English", lang: "en-US", voiceURI: "en" },
  ];
  assert.equal(selectVoice(voices, "es").voiceURI, "m");
  assert.equal(selectVoice(voices, "es", "f").voiceURI, "f");
  assert.equal(selectVoice(voices, "en", "m").voiceURI, "en");
  assert.equal(selectVoice(voices, "ja"), undefined);
});
