import HistoryControls from "./HistoryControls";
import { estimateDuration } from "./speech";
import Choice from "./Choice";
import { initialLanguage, selectVoice } from "./speech";
import Intro from "./Intro";
import { useEffect, useRef, useState, useCallback } from "react";
import { languages, messages } from "./i18n";
import { historyStore, download } from "./storage";
import { normalizeText } from "../shared/text.js";
import "./App.css";

function Language({ value, onChange, label, disabled = false }) {
  return (
    <Choice
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      items={languages.map((l) => ({
        value: l.code,
        label: l.name,
        flag: `/flags/${l.country.toLowerCase()}.svg`,
      }))}
    />
  );
}
function AudioPlayer({ blob }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return blob ? <audio ref={ref} controls /> : null;
}
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const fileRecognition =
  !!Recognition &&
  Number(navigator.userAgent.match(/(?:Chrome|Chromium)\/(\d+)/)?.[1] || 0) >=
    135;
const freshDefaults = {
  language: "es",
  volume: 1,
  rate: 1,
  sampleRate: 24000,
  format: "wav",
  clean: true,
};

export default function App() {
  const [playback, setPlayback] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  const finishIntro = useCallback(() => setShowIntro(false), []);
  const [locale, setLocale] = useState(initialLanguage);
  const t = messages[locale];
  const [dark, setDark] = useState(false),
    [tab, setTab] = useState("speak"),
    [text, setText] = useState(""),
    [options, setOptions] = useState(() => ({
      ...freshDefaults,
      language: locale,
    }));
  const [voices, setVoices] = useState(
    () => window.speechSynthesis?.getVoices() || [],
  );
  const utteranceRef = useRef(null);
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const update = () => setVoices(synth.getVoices());
    synth.addEventListener("voiceschanged", update);
    const timers = [250, 1000, 3000].map((delay) => setTimeout(update, delay));
    return () => {
      timers.forEach(clearTimeout);
      synth.removeEventListener("voiceschanged", update);
    };
  }, []);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [history, setHistory] = useState([]),
    [result, setResult] = useState(null);
  const [speechLanguage, setSpeechLanguage] = useState(locale),
    [transcript, setTranscript] = useState(""),
    [interim, setInterim] = useState(""),
    [recording, setRecording] = useState(false),
    [recorded, setRecorded] = useState(null);
  const [source, setSource] = useState(locale),
    [target, setTarget] = useState("en"),
    [original, setOriginal] = useState(""),
    [translated, setTranslated] = useState(""),
    [progress, setProgress] = useState(null);
  const recognition = useRef(null),
    resources = useRef(null),
    translator = useRef(null),
    mounted = useRef(true),
    fileInput = useRef(null),
    importInput = useRef(null);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
    try {
      localStorage.setItem("auvioz-language", locale);
    } catch {
      /* Optional browser storage or stopped audio source. */
    }
  }, [locale]);
  useEffect(() => {
    mounted.current = true;
    historyStore("getAll")
      .then((items) => {
        if (mounted.current)
          setHistory(items.sort((a, b) => b.created - a.created));
      })
      .catch(() => {
        if (mounted.current) setNotice("error");
      });
    return () => {
      mounted.current = false;
      recognition.current?.abort();
      resources.current?.();
      translator.current?.destroy();
      window.speechSynthesis?.cancel();
    };
  }, []);
  const option = (key, value) => setOptions((o) => ({ ...o, [key]: value }));
  function speakText(value, settings = options, historyState = null) {
    const normalized = normalizeText(value, settings.clean);
    if (!normalized) {
      setNotice("emptyText");
      return false;
    }
    const synth = window.speechSynthesis;
    const voice = selectVoice(
      synth?.getVoices() || [],
      settings.language,
      settings.voiceURI,
    );
    if (!synth || !voice) {
      setNotice("noVoice");
      return false;
    }
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    synth.cancel();
    setPlayback(historyState);
    const utterance = new SpeechSynthesisUtterance(normalized);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.volume = settings.volume ?? 1;
    utterance.rate = settings.rate ?? 1;
    utterance.onend = () => {
      setBusy(false);
      setPlayback((p) =>
        p ? { ...p, offset: p.duration, started: null } : null,
      );
    };
    utterance.onerror = (e) => {
      setPlayback((p) => (p ? { ...p, started: null } : null));
      if (e.error !== "canceled" && e.error !== "interrupted")
        setNotice("error");
      setBusy(false);
    };
    utteranceRef.current = utterance;
    setNotice("");
    setBusy(true);
    synth.speak(utterance);
    return true;
  }
  function playHistory(item, offset = 0) {
    const normalized = normalizeText(item.text, item.clean);
    const chars = [...normalized];
    const duration = estimateDuration(normalized, item.rate);
    if (offset >= duration) {
      stop();
      setPlayback({ id: item.id, offset: duration, duration, started: null });
      return;
    }
    let index = Math.floor((Math.max(0, offset) / duration) * chars.length);
    // Use a word boundary when one is nearby; CJK text may have no spaces.
    const nextSpace = chars.indexOf(" ", index);
    if (index > 0 && nextSpace >= index && nextSpace - index < 15)
      index = nextSpace + 1;
    if (index >= chars.length) index = Math.max(0, chars.length - 1);
    speakText(chars.slice(index).join(""), item, {
      id: item.id,
      offset: (duration * index) / chars.length,
      duration,
      started: Date.now(),
    });
  }
  async function generate() {
    if (!speakText(text)) return;
    const voice = selectVoice(voices, options.language, options.voiceURI);
    const item = {
      ...options,
      voiceURI: voice?.voiceURI,
      id: crypto.randomUUID(),
      created: Date.now(),
      name: text.trim().slice(0, 45),
      text,
    };
    setResult(item);
    setHistory((h) => [item, ...h]);
    try {
      await historyStore("put", item);
    } catch {
      setNotice("error");
    }
  }
  function stop() {
    setPlayback((p) =>
      p
        ? {
            ...p,
            offset: Math.min(
              p.duration,
              p.offset + (p.started ? (Date.now() - p.started) / 1000 : 0),
            ),
            started: null,
          }
        : null,
    );
    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    window.speechSynthesis?.cancel();
    setBusy(false);
    recognition.current?.stop();
    resources.current?.();
    resources.current = null;
    setRecording(false);
  }
  async function remove(id) {
    try {
      await historyStore("delete", id);
      setHistory((h) => h.filter((item) => item.id !== id));
      if (result?.id === id) setResult(null);
    } catch {
      setNotice("error");
    }
  }
  async function rename(item) {
    const name = window.prompt(t.name, item.name);
    if (!name?.trim()) return;
    const next = { ...item, name: name.trim().slice(0, 100) };
    try {
      await historyStore("put", next);
      setHistory((h) => h.map((x) => (x.id === item.id ? next : x)));
    } catch {
      setNotice("error");
    }
  }
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("copied");
    } catch {
      setNotice("error");
    }
  }
  function makeRecognition() {
    const rec = new Recognition();
    rec.lang = languages.find((l) => l.code === speechLanguage).locale;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let final = "",
        partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else partial += e.results[i][0].transcript;
      }
      if (final) setTranscript((old) => old + final);
      setInterim(partial);
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted") setNotice("error");
    };
    rec.onend = () => {
      setRecording(false);
      setInterim("");
      resources.current?.();
      resources.current = null;
      recognition.current = null;
    };
    recognition.current = rec;
    return rec;
  }
  async function startMic() {
    if (!Recognition) {
      setNotice("unsupportedSpeech");
      return;
    }
    setNotice("");
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let recorder;
      resources.current = () => {
        if (recorder?.state === "recording") recorder.stop();
        stream.getTracks().forEach((track) => track.stop());
      };
      if (window.MediaRecorder) {
        const chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        recorder.onstop = () => {
          if (chunks.length && mounted.current)
            setRecorded(new Blob(chunks, { type: recorder.mimeType }));
        };
        recorder.start();
      }
      const rec = makeRecognition();
      rec.onstart = () => setRecording(true);
      rec.start();
    } catch {
      resources.current?.();
      resources.current = null;
      setNotice("error");
    } finally {
      setBusy(false);
    }
  }
  async function transcribeFile(file) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setNotice("fileTooLarge");
      return;
    }
    if (!fileRecognition) {
      setNotice("fileSupport");
      return;
    }
    setNotice("");
    setBusy(true);
    try {
      const ctx = new AudioContext();
      let src;
      resources.current = () => {
        try {
          src?.stop();
        } catch {
          /* Optional browser storage or stopped audio source. */
        }
        void ctx.close();
      };
      await ctx.resume();
      const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
      src = ctx.createBufferSource();
      src.buffer = buffer;
      const destination = ctx.createMediaStreamDestination();
      src.connect(destination);
      const rec = makeRecognition();
      rec.onstart = () => {
        setRecording(true);
        src.start();
      };
      src.onended = () => {
        setTimeout(() => {
          if (recognition.current === rec) rec.stop();
        }, 1000);
      };
      rec.start(destination.stream.getAudioTracks()[0]);
    } catch {
      resources.current?.();
      resources.current = null;
      setNotice("fileSupport");
    } finally {
      setBusy(false);
    }
  }
  async function translate() {
    if (!original.trim()) {
      setNotice("emptyText");
      return;
    }
    if (source === target) {
      setTranslated(original);
      return;
    }
    if (!window.Translator) {
      setNotice("unsupportedTranslator");
      return;
    }
    setBusy(true);
    setNotice("");
    setTranslated("");
    try {
      const params = { sourceLanguage: source, targetLanguage: target };
      const availability = await window.Translator.availability(params);
      if (availability === "unavailable") {
        setNotice("translatorUnavailable");
        return;
      }
      translator.current?.destroy();
      translator.current = await window.Translator.create({
        ...params,
        monitor(m) {
          m.addEventListener("downloadprogress", (e) =>
            setProgress(Math.round(e.loaded * 100)),
          );
        },
      });
      setTranslated(await translator.current.translate(original));
    } catch {
      setNotice("error");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }
  async function importHistory(file) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setNotice("fileTooLarge");
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data) || data.length > 100) throw new Error();
      const items = data.map((row) => {
        const value = row.text || row.texto;
        if (typeof value !== "string" || !value.trim() || value.length > 5000)
          throw new Error();
        return {
          ...freshDefaults,
          voiceURI: typeof row.voiceURI === "string" ? row.voiceURI : "",
          language: languages.some((l) => l.code === row.language)
            ? row.language
            : "es",
          volume:
            Number.isFinite(row.volume) && row.volume >= 0.1 && row.volume <= 1
              ? row.volume
              : 1,
          rate:
            Number.isFinite(row.rate) && row.rate >= 0.5 && row.rate <= 2
              ? row.rate
              : 1,
          sampleRate: [16000, 22050, 24000, 44100, 48000].includes(
            row.sampleRate,
          )
            ? row.sampleRate
            : 24000,
          format: row.format === "mp3" ? "mp3" : "wav",
          clean: typeof row.clean === "boolean" ? row.clean : true,
          text: value,
          name:
            typeof row.name === "string"
              ? row.name.slice(0, 100)
              : value.slice(0, 45),
          id: crypto.randomUUID(),
          created: Date.now(),
        };
      });
      for (const item of items) await historyStore("put", item);
      setHistory((h) => [...items, ...h]);
      setNotice("saved");
    } catch {
      setNotice("error");
    }
  }
  function switchTab(next) {
    stop();
    setNotice("");
    setTab(next);
  }

  if (showIntro) return <Intro locale={locale} onDone={finishIntro} />;
  return (
    <div className={dark ? "app dark" : "app"}>
      <header>
        <a className="brand" href="#">
          <img
            className="brand-logo"
            src="/logo_auvioz.jpg"
            alt=""
            width="48"
            height="48"
          />
          <strong>
            Auvioz<span>®</span>
          </strong>
        </a>
        <div className="header-actions">
          <Language value={locale} onChange={setLocale} label={t.language} />
          <button
            className="icon-button"
            onClick={() => setDark(!dark)}
            aria-label={t.theme}
          >
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </header>
      <main>
        <div className="intro">
          <span className="eyebrow">AUVIOZ STUDIO</span>
          <h1>{t.slogan}</h1>
          <p>{t.browserVoice}</p>
        </div>
        <nav aria-label="Auvioz">
          <div className="tabs">
            {["speak", "transcribe", "translate"].map((key, i) => (
              <button
                key={key}
                aria-current={tab === key ? "page" : undefined}
                onClick={() => switchTab(key)}
              >
                <span aria-hidden="true">{["≋", "◉", "文"][i]}</span>
                {t[key]}
              </button>
            ))}
          </div>
        </nav>
        {notice && (
          <div className="notice" role="status">
            {t[notice]}
          </div>
        )}
        {tab === "speak" && (
          <div className="studio-grid">
            <section className="panel editor">
              <div className="panel-title">
                <h2>{t.text}</h2>
                <span>{text.length.toLocaleString(locale)} / 5,000</span>
              </div>
              <textarea
                aria-label={t.text}
                placeholder={t.placeholder}
                maxLength={5000}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="editor-bottom">
                <label className="check">
                  <input
                    type="checkbox"
                    checked={options.clean}
                    onChange={(e) => option("clean", e.target.checked)}
                  />
                  {t.clean}
                </label>
                <button className="text-button" onClick={() => setText("")}>
                  ⌫ {t.clear}
                </button>
              </div>
              <p className="hint">{t.cleanHelp}</p>
              {result && (
                <div className="result">
                  <button onClick={() => speakText(result.text, result)}>
                    ▶ {t.speak}
                  </button>
                  {busy && <button onClick={stop}>{t.stop}</button>}
                </div>
              )}
            </section>
            <aside className="panel settings">
              <Language
                label={t.language}
                value={options.language}
                onChange={(value) => option("language", value)}
              />
              <Choice
                label={t.voice}
                emptyLabel={t.noVoice}
                value={
                  selectVoice(voices, options.language, options.voiceURI)
                    ?.voiceURI || ""
                }
                onChange={(value) => option("voiceURI", value)}
                items={voices
                  .filter(
                    (v) =>
                      v.lang.toLowerCase().split(/[-_]/)[0] ===
                      options.language,
                  )
                  .map((v) => ({ value: v.voiceURI, label: v.name }))}
              />

              <label className="field">
                {t.volume}
                <output>{Math.round(options.volume * 100)}%</output>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={options.volume}
                  onChange={(e) => option("volume", +e.target.value)}
                />
              </label>
              <label className="field">
                {t.speed}
                <output>{options.rate}×</output>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={options.rate}
                  onChange={(e) => option("rate", +e.target.value)}
                />
              </label>
              <button className="primary" disabled={busy} onClick={generate}>
                {busy ? t.working : <>▶ {t.generate}</>}{" "}
                <span aria-hidden="true">↗</span>
              </button>
              {busy && <button onClick={stop}>{t.stop}</button>}
            </aside>
            <section className="panel history">
              <div className="panel-title">
                <h2>
                  {t.history} <small>{history.length}</small>
                </h2>
                <div className="actions">
                  <button
                    onClick={() =>
                      download(
                        new Blob(
                          [
                            JSON.stringify(
                              history.map(({ blob, ...item }) => {
                                void blob;
                                return item;
                              }),
                              null,
                              2,
                            ),
                          ],
                          { type: "application/json" },
                        ),
                        "auvioz-history.json",
                      )
                    }
                  >
                    ↥ {t.export}
                  </button>
                  <button onClick={() => importInput.current.click()}>
                    ↧ {t.import}
                  </button>
                  <input
                    ref={importInput}
                    type="file"
                    accept="application/json"
                    hidden
                    onChange={(e) => {
                      importHistory(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              {!history.length ? (
                <p className="empty">{t.empty}</p>
              ) : (
                history.map((item) => (
                  <article className="history-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{new Date(item.created).toLocaleString(locale)}</p>
                      <p>{item.text}</p>
                    </div>
                    <AudioPlayer blob={item.blob} />
                    <HistoryControls
                      item={item}
                      playback={playback}
                      onSeek={playHistory}
                      locale={locale}
                    />
                    <div className="actions">
                      {item.blob && (
                        <button
                          onClick={() =>
                            download(
                              item.blob,
                              `auvioz-${item.id}.${item.format}`,
                            )
                          }
                        >
                          {t.download} {item.format?.toUpperCase()}
                        </button>
                      )}
                      <button onClick={() => playHistory(item)}>
                        ▶ {t.speak}
                      </button>
                      {busy && playback?.id === item.id && (
                        <button onClick={stop}>■ {t.stop}</button>
                      )}
                      <button onClick={() => rename(item)}>✎ {t.rename}</button>
                      <button onClick={() => remove(item.id)}>
                        ⌫ {t.remove}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        )}
        {tab === "transcribe" && (
          <section className="panel workspace-panel">
            <div className="panel-title">
              <h2>{t.transcribe}</h2>
              <Language
                label={t.language}
                value={speechLanguage}
                onChange={setSpeechLanguage}
                disabled={recording || busy}
              />
            </div>
            <p className="hint">{t.privacy}</p>
            {!Recognition && <p role="status">{t.unsupportedSpeech}</p>}
            <div className="actions">
              <button
                className="primary"
                disabled={!Recognition || busy}
                onClick={recording ? stop : startMic}
              >
                {recording ? t.stop : <>● {t.mic}</>}
              </button>
              <button
                disabled={recording || busy || !fileRecognition}
                onClick={() => fileInput.current.click()}
              >
                ↥ {t.upload}
              </button>
              <input
                hidden
                type="file"
                accept="audio/*"
                ref={fileInput}
                onChange={(e) => {
                  transcribeFile(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="hint">
              {t.fileHelp} {!fileRecognition && t.fileSupport}
            </p>
            {recording && (
              <p role="status" className="recording">
                ● {t.recording}
              </p>
            )}
            <label className="field">
              {t.transcript}
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </label>
            {interim && (
              <p className="hint" aria-live="polite">
                {interim}
              </p>
            )}
            <div className="actions">
              <button disabled={!transcript} onClick={() => copy(transcript)}>
                ⧉ {t.copy}
              </button>
              <button onClick={() => setTranscript("")}>⌫ {t.clear}</button>
            </div>
            {recorded && (
              <div className="result">
                <AudioPlayer blob={recorded} />
                <button
                  onClick={() =>
                    download(
                      recorded,
                      `auvioz-recording.${recorded.type.includes("mp4") ? "m4a" : recorded.type.includes("ogg") ? "ogg" : "webm"}`,
                    )
                  }
                >
                  {t.download}
                </button>
              </div>
            )}
          </section>
        )}
        {tab === "translate" && (
          <section className="panel workspace-panel">
            <div className="translation-grid">
              <div>
                <Language
                  label={t.source}
                  value={source}
                  onChange={setSource}
                  disabled={busy}
                />
                <textarea
                  aria-label={t.source}
                  value={original}
                  maxLength={5000}
                  onChange={(e) => setOriginal(e.target.value)}
                  placeholder={t.placeholder}
                />
                <div className="actions">
                  <button
                    aria-label={t.copy + " · " + t.source}
                    disabled={!original}
                    onClick={() => copy(original)}
                  >
                    ⧉ {t.copy}
                  </button>
                  <button
                    aria-label={t.speak + " · " + t.source}
                    disabled={!original}
                    onClick={() =>
                      speakText(original, {
                        ...options,
                        language: source,
                        voiceURI: "",
                      })
                    }
                  >
                    ▶ {t.speak}
                  </button>
                </div>
              </div>
              <div>
                <Language
                  label={t.target}
                  value={target}
                  onChange={setTarget}
                  disabled={busy}
                />
                <textarea aria-label={t.target} readOnly value={translated} />
                <div className="actions">
                  <button
                    aria-label={t.copy + " · " + t.target}
                    disabled={!translated}
                    onClick={() => copy(translated)}
                  >
                    ⧉ {t.copy}
                  </button>
                  <button
                    aria-label={t.speak + " · " + t.target}
                    disabled={!translated}
                    onClick={() =>
                      speakText(translated, {
                        ...options,
                        language: target,
                        voiceURI: "",
                      })
                    }
                  >
                    ▶ {t.speak}
                  </button>
                  {busy && <button onClick={stop}>{t.stop}</button>}
                </div>
              </div>
            </div>
            <p className="hint translation-note">
              {window.Translator ? t.downloadModel : t.unsupportedTranslator}
            </p>
            {progress !== null && (
              <progress
                value={progress}
                max="100"
                aria-label={t.downloadModel}
              />
            )}
            <div className="actions translation-action">
              <button
                className="primary"
                disabled={busy || (!window.Translator && source !== target)}
                onClick={translate}
              >
                {busy ? t.working : t.translateAction}
              </button>
            </div>
          </section>
        )}
      </main>
      <footer className="copyright">
        © 2026 —{" "}
        <a
          href="https://github.com/MateoRiosdev"
          target="_blank"
          rel="noopener noreferrer"
        >
          (MateoRiosdev)
        </a>{" "}
        · Todos los derechos reservados
      </footer>
    </div>
  );
}
