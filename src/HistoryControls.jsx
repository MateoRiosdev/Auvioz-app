import { useEffect, useState } from "react";
import { estimateDuration } from "./speech";
const time = (value) =>
  `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
const captions = {
  es: "Tiempo aproximado. Buscar reinicia la lectura desde el texto elegido.",
  en: "Estimated time. Seeking restarts speech from the selected text.",
  pt: "Tempo aproximado. Buscar reinicia a leitura no texto escolhido.",
  fr: "Temps estimé. La recherche relance la lecture au texte choisi.",
  de: "Geschätzte Zeit. Springen startet die Sprachausgabe am gewählten Text neu.",
  it: "Tempo stimato. La ricerca riavvia la lettura dal testo scelto.",
  ja: "推定時間です。移動すると選択位置から読み直します。",
  zh: "估计时间。跳转后将从所选文本重新朗读。",
  ru: "Примерное время. Перемотка запускает чтение с выбранного текста.",
  hi: "अनुमानित समय। आगे या पीछे जाने पर चुने गए पाठ से पढ़ना शुरू होगा।",
};
export default function HistoryControls({ item, playback, onSeek, locale }) {
  const [now, setNow] = useState(Date.now);
  const current = playback?.id === item.id ? playback : null;
  useEffect(() => {
    if (!current?.started) return;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [current?.started]);
  const duration = current?.duration || estimateDuration(item.text, item.rate);
  const position = Math.min(
    duration,
    (current?.offset || 0) +
      (current?.started ? Math.max(0, now - current.started) / 1000 : 0),
  );
  return (
    <div className="history-timeline">
      <div className="timeline-controls">
        <button
          onClick={() => onSeek(item, Math.max(0, position - 10))}
          aria-label="−10 s"
        >
          ↶ 10
        </button>
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={position}
          aria-label={captions[locale]}
          onChange={(e) => onSeek(item, Number(e.target.value))}
        />
        <button
          onClick={() => onSeek(item, Math.min(duration, position + 10))}
          aria-label="+10 s"
        >
          10 ↷
        </button>
        <output>
          ≈ {time(position)} / {time(duration)}
        </output>
      </div>
      <small>{captions[locale]}</small>
    </div>
  );
}
