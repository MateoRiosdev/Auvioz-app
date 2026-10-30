import { useEffect, useRef, useState } from "react";
const labels = {
  es: "Omitir intro",
  en: "Skip intro",
  pt: "Pular introdução",
  fr: "Passer l’intro",
  de: "Intro überspringen",
  it: "Salta intro",
  ja: "イントロをスキップ",
  zh: "跳过片头",
  ru: "Пропустить заставку",
  ar: "تخطي المقدمة",
  hi: "इंट्रो छोड़ें",
  tr: "Girişi atla",
};
export default function Intro({ locale, onDone }) {
  const video = useRef(null);
  const [blocked, setBlocked] = useState(false);
  const [source] = useState(() =>
    window.matchMedia("(max-width: 760px)").matches ? "1" : "2",
  );
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    let active = true;
    const timer = setTimeout(onDone, 20000);
    video.current?.play()?.catch(() => {
      if (active) {
        clearTimeout(timer);
        setBlocked(true);
      }
    });
    const key = (e) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", key);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("keydown", key);
    };
  }, [onDone]);
  return (
    <section
      className="welcome-intro"
      aria-label="Auvioz"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={video}
        src={`/media/Auvioz_app_logo_animation_${source}.mp4`}
        playsInline
        preload="auto"
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        onEnded={onDone}
        onError={onDone}
        onDragStart={(e) => e.preventDefault()}
        tabIndex={-1}
      />
      {blocked && (
        <button
          className="intro-play"
          aria-label="Play intro"
          onClick={() => {
            video.current
              ?.play()
              .then(() => setBlocked(false))
              .catch(() => setBlocked(true));
          }}
        >
          ▶ {locale === "es" ? "Reproducir intro" : "Play intro"}
        </button>
      )}
      <button className="intro-skip" onClick={onDone}>
        {labels[locale] || labels.es} <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
