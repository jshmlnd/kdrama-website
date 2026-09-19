export function SubtitleTrack({ subtitle }) {
  if (!subtitle?.url) return null;

  return <track kind="subtitles" src={subtitle.url} srcLang={subtitle.lang || 'en'} label={subtitle.label || subtitle.lang?.toUpperCase() || 'Subtitles'} />;
}

export default function Subtitle({ text }) {
  if (!text) return null;

  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-3 bottom-20 z-10 flex justify-center px-2 sm:bottom-24">
      <span className="glass max-w-3xl rounded-xl border-primary/25 bg-[#0b0710]/20 px-4 py-2 text-center text-sm font-semibold leading-relaxed text-primary [text-shadow:0_1px_7px_rgba(0,0,0,0.9)] shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-5 sm:py-2.5 sm:text-base">
        {text}
      </span>
    </div>
  );
}
