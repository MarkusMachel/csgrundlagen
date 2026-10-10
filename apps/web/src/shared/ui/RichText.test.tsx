import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RichText } from './RichText';

describe('RichText', () => {
  it('highlights fenced code with the language label', () => {
    const { container } = render(
      <RichText text={'Use a map.\n\n```go\nfunc f() int { return 1 }\n```'} />,
    );
    expect(screen.getByText('Use a map.')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    const code = container.querySelector('code.language-go');
    expect(code?.querySelector('.hljs-keyword')?.textContent).toBe('func');
    expect(code?.textContent).toBe('func f() int { return 1 }');
  });

  it('resolves aliases and escapes unknown languages instead of injecting them', () => {
    const { container } = render(
      <RichText text={'```cs\nvar x = 1;\n```\n```brainfuck\n<b>not html</b>\n```'} />,
    );
    expect(screen.getByText('C#')).toBeInTheDocument();
    expect(screen.getByText('brainfuck')).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText('<b>not html</b>')).toBeInTheDocument();
  });

  it('renders inline code spans', () => {
    render(<RichText text="Call `ctx.Done()` first." />);
    expect(screen.getByText('ctx.Done()')).toHaveClass('inline-code');
  });
});
