export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-8">
      <div className="h-6 w-48 animate-pulse rounded bg-[var(--color-surface-muted)]" />
      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        <div className="h-[420px] animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" />
        <div className="h-[420px] animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" />
      </div>
    </main>
  );
}
