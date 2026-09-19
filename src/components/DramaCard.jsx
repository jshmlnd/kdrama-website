export default function DramaCard({ drama, onOpen }) {
  return (
    <article
      onClick={() => onOpen(drama)}
      className="glass card cursor-pointer overflow-hidden rounded-box transition-all duration-200 hover:-translate-y-1.5 hover:border-primary"
    >
      <div
        className="flex aspect-[2/3] items-end p-3.5 font-bold leading-snug [text-shadow:0_2px_10px_rgba(0,0,0,0.6)]"
        style={{ background: `linear-gradient(160deg, hsl(${drama.hue},70%,45%), hsl(${drama.hue + 40},60%,20%))` }}
      >
        {drama.title}
      </div>
      <div className="px-3.5 pt-3 pb-4">
        <div className="text-sm font-semibold">{drama.title}</div>
        <div className="mt-1 flex justify-between text-xs text-neutral-content">
          <span>{drama.year} · {drama.genre}</span>
          <span className="text-accent">★ {drama.rating}</span>
        </div>
      </div>
    </article>
  );
}
