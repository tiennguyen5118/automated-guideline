export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-[1024px] flex-1 flex-col gap-6 px-6 py-8">
      <div className="h-6 w-64 animate-pulse rounded bg-[var(--color-surface-muted)]" />
      <div className="h-[420px] animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" />
    </main>
  );
}
