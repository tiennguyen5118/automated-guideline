'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import {
  GuidelineInputSchema,
  GUIDELINE_MAX_CHARS,
  type GuidelineInput,
} from '@/lib/schemas/guideline.schema';
import {
  generateAction,
  regenerateAction,
  publishAction,
} from '@/lib/actions/guidelines';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { PublishBar } from './PublishBar';

const MermaidPreview = dynamic(() => import('./MermaidPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[240px] items-center justify-center">
      <Spinner label="Loading preview" />
    </div>
  ),
});

type ReadyState = {
  status: 'ready';
  guidelineId: string;
  kind: 'flowchart' | 'infographic';
  mermaidSource: string;
  publishedUrl: string | null;
};

type EditorState =
  | { status: 'idle' }
  | { status: 'generating' }
  | ReadyState
  | { status: 'error'; message: string; guidelineId: string | null; lastSource: string };

export type GuidelineEditorProps = {
  initial?: {
    guidelineId: string;
    sourceText: string;
    kind: 'flowchart' | 'infographic';
    mermaidSource: string;
  };
};

export function GuidelineEditor({ initial }: GuidelineEditorProps) {
  const [state, setState] = useState<EditorState>(() =>
    initial
      ? {
          status: 'ready',
          guidelineId: initial.guidelineId,
          kind: initial.kind,
          mermaidSource: initial.mermaidSource,
          publishedUrl: null,
        }
      : { status: 'idle' },
  );
  const [publishing, startPublishTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GuidelineInput>({
    resolver: zodResolver(GuidelineInputSchema),
    defaultValues: { sourceText: initial?.sourceText ?? '' },
    mode: 'onSubmit',
  });

  const sourceText = watch('sourceText');
  const isBusy = state.status === 'generating';
  const guidelineId =
    state.status === 'ready'
      ? state.guidelineId
      : state.status === 'error'
        ? state.guidelineId
        : null;

  async function onSubmit(values: GuidelineInput) {
    setState({ status: 'generating' });
    const res = guidelineId
      ? await regenerateAction({ guidelineId, sourceText: values.sourceText })
      : await generateAction({ sourceText: values.sourceText });
    if (res.ok) {
      setState({
        status: 'ready',
        guidelineId: res.data.guidelineId,
        kind: res.data.kind,
        mermaidSource: res.data.mermaidSource,
        publishedUrl: null,
      });
    } else {
      setState({
        status: 'error',
        message: res.error.message,
        guidelineId,
        lastSource: values.sourceText,
      });
    }
  }

  function onPublish() {
    if (state.status !== 'ready') return;
    const id = state.guidelineId;
    startPublishTransition(async () => {
      const res = await publishAction({ guidelineId: id });
      if (res.ok) {
        setState((prev) =>
          prev.status === 'ready' ? { ...prev, publishedUrl: res.data.url } : prev,
        );
      } else {
        setState({
          status: 'error',
          message: res.error.message,
          guidelineId: id,
          lastSource: sourceText,
        });
      }
    });
  }

  const primaryLabel = guidelineId ? 'Regenerate' : 'Generate';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid flex-1 gap-6 lg:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Guideline source</h2>
          <span className="text-xs text-[var(--color-text-muted)]">Plain text or Markdown</span>
        </CardHeader>
        <CardBody className="flex flex-1 flex-col gap-4">
          <Textarea
            label="Paste guideline text"
            placeholder="e.g. To request leave: 1) Submit form in HR portal. 2) Manager reviews within 2 business days…"
            maxChars={GUIDELINE_MAX_CHARS}
            currentChars={sourceText?.length ?? 0}
            error={errors.sourceText?.message}
            hint={errors.sourceText ? undefined : 'Under 25,000 characters.'}
            disabled={isBusy}
            {...register('sourceText')}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" disabled={isBusy}>
              {isBusy ? <Spinner label="Generating" /> : null}
              {isBusy ? 'Generating…' : primaryLabel}
            </Button>
            {state.status === 'ready' ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onPublish}
                disabled={publishing}
              >
                {publishing ? 'Publishing…' : 'Publish'}
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Preview</h2>
          {state.status === 'ready' ? (
            <span className="rounded border border-[var(--color-border)] px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {state.kind}
            </span>
          ) : null}
        </CardHeader>
        <CardBody className="flex flex-1 flex-col gap-3">
          {state.status === 'idle' ? (
            <p className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-muted)]">
              Paste a guideline and click Generate.
            </p>
          ) : null}
          {state.status === 'generating' ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Spinner label="Generating" />
              Generating visualization…
            </div>
          ) : null}
          {state.status === 'ready' ? (
            <>
              <MermaidPreview source={state.mermaidSource} />
              {state.publishedUrl ? <PublishBar url={state.publishedUrl} /> : null}
            </>
          ) : null}
          {state.status === 'error' ? (
            <Alert
              variant="error"
              title="Generation failed"
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSubmit(onSubmit)}
                >
                  Retry
                </Button>
              }
            >
              {state.message}
            </Alert>
          ) : null}
        </CardBody>
      </Card>
    </form>
  );
}
