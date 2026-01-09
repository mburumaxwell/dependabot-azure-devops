'use client';

import { Handshake, ThumbsDown, ThumbsUp } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { type SyntheticEvent, useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Field, FieldGroup, FieldSet } from '@/components/ui/field';
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Textarea } from '@/components/ui/textarea';
import {
  type FeedbackOpinion,
  type SubmitFeedback,
  type SubmitFeedbackResponse,
  SubmitFeedbackResponseSchema,
  SubmitFeedbackSchema,
} from '@/lib/feedback';

const feedbackResult = SubmitFeedbackSchema.extend({
  response: SubmitFeedbackResponseSchema,
});

function useSubmissionStorage<Result>(id: string, validate: (v: unknown) => Result | null) {
  const storageKey = `docs-feedback-${id}`;
  const [value, setValue] = useState<Result | null>(null);

  useEffect(() => {
    const item = localStorage.getItem(storageKey);
    if (item === null) return;
    const validated = validate(JSON.parse(item));

    if (validated !== null) setValue(validated);
  }, [storageKey, validate]);

  return {
    previous: value,
    setPrevious(result: Result | null) {
      if (result) localStorage.setItem(storageKey, JSON.stringify(result));
      else localStorage.removeItem(storageKey);

      setValue(result);
    },
  };
}

/**
 * A feedback component to be attached at the end of page
 */
export function Feedback({
  onSendAction,
}: {
  onSendAction: (feedback: SubmitFeedback) => Promise<SubmitFeedbackResponse>;
}) {
  const url = usePathname();
  const { previous, setPrevious } = useSubmissionStorage(url, (v) => {
    const result = feedbackResult.safeParse(v);
    return result.success ? result.data : null;
  });
  const [opinion, setOpinion] = useState<FeedbackOpinion | null>(null);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit(e?: SyntheticEvent) {
    if (opinion == null) return;

    startTransition(async () => {
      const feedback: SubmitFeedback = {
        url,
        opinion,
        message,
      };

      const response = await onSendAction(feedback);
      setPrevious({
        response,
        ...feedback,
      });
      setMessage('');
      setOpinion(null);
    });

    e?.preventDefault();
  }

  const activeOpinion = previous?.opinion ?? opinion;

  return (
    <Collapsible
      open={opinion !== null || previous !== null}
      onOpenChange={(v) => {
        if (!v) setOpinion(null);
      }}
    >
      <div className='flex flex-row items-center gap-2'>
        <p className='text-sm font-medium pe-2'>How is this guide?</p>
        <Button
          disabled={previous !== null}
          variant={activeOpinion === 'good' ? 'default' : 'outline'}
          className='rounded-full'
          onClick={() => setOpinion('good')}
        >
          <ThumbsUp />
          Good
        </Button>
        <Button
          disabled={previous !== null}
          variant={activeOpinion === 'bad' ? 'default' : 'outline'}
          className='rounded-full'
          onClick={() => setOpinion('bad')}
        >
          <ThumbsDown />
          Bad
        </Button>
      </div>
      <CollapsibleContent className='mt-3'>
        {previous ? (
          <Item variant='muted'>
            <ItemMedia variant='image'>
              <Handshake />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className='text-muted-foreground '>Thank you for your feedback!</ItemTitle>
            </ItemContent>
            <ItemActions>
              {previous.response?.url && (
                <a href={previous.response.url} rel='noreferrer noopener' target='_blank'>
                  <Button size='sm' className='text-xs'>
                    View Submission
                  </Button>
                </a>
              )}

              <Button
                variant='secondary'
                size='sm'
                className='text-xs'
                onClick={() => {
                  setOpinion(previous.opinion as FeedbackOpinion);
                  setPrevious(null);
                }}
              >
                Submit Again
              </Button>
            </ItemActions>
          </Item>
        ) : (
          <form className='flex flex-col gap-3' onSubmit={submit}>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <Textarea
                    autoFocus
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className='resize-none'
                    placeholder='Leave your feedback...'
                    onKeyDown={(e) => {
                      if (!e.shiftKey && e.key === 'Enter') {
                        submit(e);
                      }
                    }}
                  />
                </Field>
                <Field orientation='horizontal'>
                  <Button type='submit' disabled={isPending} variant='outline'>
                    Submit
                  </Button>
                </Field>
              </FieldGroup>
            </FieldSet>
          </form>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
