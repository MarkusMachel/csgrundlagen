import { Fragment } from 'react';

import { parseInline, parseRichText } from '@/shared/utils/richText';

import { CodeBlock } from './CodeBlock';

/** Prose with `inline code` spans; line breaks are kept by the caller's white-space. */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) =>
        part.kind === 'code' ? (
          <code key={i} className="inline-code">
            {part.code}
          </code>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * Renders question text: paragraphs with `inline code`, and ```lang fenced
 * blocks as syntax-highlighted code (format: shared/utils/richText.ts).
 */
export function RichText({ text }: { text: string }) {
  return (
    <div className="rich-text">
      {parseRichText(text).map((segment, i) =>
        segment.kind === 'code' ? (
          <CodeBlock key={i} code={segment.code} lang={segment.lang} />
        ) : (
          <p key={i} className="rich-text__p">
            <InlineText text={segment.text} />
          </p>
        ),
      )}
    </div>
  );
}
