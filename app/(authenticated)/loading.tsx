export default function AuthLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-zinc-200" />
      <div className="mt-2 h-4 w-64 rounded bg-zinc-100" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
