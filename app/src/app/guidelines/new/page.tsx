import { GuidelineEditor } from '@/components/app/guidelines/GuidelineEditor';

export const metadata = {
  title: 'New guideline · Automated Visual Guidelines',
};

export default function NewGuidelinePage() {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          New guideline
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Paste policy, procedure, or announcement text. The system selects a flowchart or
          infographic layout automatically.
        </p>
      </header>
      <GuidelineEditor />
    </main>
  );
}
