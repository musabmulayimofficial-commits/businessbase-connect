export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, #23272C 0%, #1D2024 45%, #17191C 100%)",
        }}
      />
      <div
        className="animate-drift absolute -left-[18%] top-[-12%] size-[46rem] rounded-full opacity-[0.55] blur-[110px]"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, rgba(64,132,235,0.22), rgba(23,25,28,0) 70%)",
        }}
      />
      <div
        className="animate-drift-slow absolute -right-[14%] top-[28%] size-[38rem] rounded-full opacity-[0.45] blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, rgba(120,150,190,0.16), rgba(23,25,28,0) 70%)",
        }}
      />
      <div
        className="animate-drift absolute bottom-[-20%] left-[30%] size-[42rem] rounded-full opacity-[0.4] blur-[130px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(64,132,235,0.14), rgba(23,25,28,0) 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(80% 60% at 50% 20%, #000 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
