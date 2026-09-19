export default function Hero() {
  return (
    <section className="glass mb-10 overflow-hidden rounded-box px-8 py-16 sm:px-12">
      <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
        Your next <em className="not-italic text-primary">obsession</em> starts here.
      </h1>
      <p className="mt-4 mb-7 max-w-md text-neutral-content">
        Stream the latest K-dramas — romance, thriller, fantasy and everything in between. New episodes weekly.
      </p>
      <a href="#trending" className="btn btn-primary rounded-field bg-gradient-to-br from-primary to-secondary border-none px-8 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_#ff4d8d55]">
        Browse Trending
      </a>
    </section>
  );
}
