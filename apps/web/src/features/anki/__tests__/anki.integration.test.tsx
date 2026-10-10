import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { QuestionCard, type Question } from '@/features/questions';
import { db } from '@/mocks/db';
import { AdminPage } from '@/pages/AdminPage';
import { BookmarksPage } from '@/pages/BookmarksPage';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

const DECK =
  '#separator:tab\n#html:true\n#tags column:3\n' +
  'What is a <b>goroutine</b>?\tA lightweight thread.<br>Managed by the Go runtime.\tcs::Async_&_Concurrency\n' +
  'What does <code>defer</code> do?\tRuns a call when the function returns.\t\n';

describe('flashcards', () => {
  it('shows the front, then the back, and grades by "I knew it"', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const card: Question = {
      id: 'fc1',
      type: 'flashcard',
      prompt: 'What is a goroutine?',
      explanation: 'A lightweight thread.',
      tags: ['Go'],
    };
    db.questions.push({ question: card });
    renderWithProviders(<QuestionCard question={card} mode="feed" />);
    expect(screen.queryByText('A lightweight thread.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit answer' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.getByText('A lightweight thread.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'I knew it' }));
    expect(await screen.findByTestId('answer-feedback')).toHaveTextContent('Correct');
    expect(screen.getByRole('button', { name: 'I knew it' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('Anki import (integration)', () => {
  it('previews a deck, maps tags to topics, imports, and skips duplicates on a second import', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    renderWithProviders(<AdminPage />);
    await user.click(screen.getByRole('tab', { name: 'Import' }));

    const file = new File([DECK], 'go.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText(/Anki text export/), file);
    expect(await screen.findByText(/2 cards found in go.txt/)).toBeInTheDocument();
    const preview = screen.getByRole('table');
    expect(within(preview).getByText('Async & Concurrency')).toBeInTheDocument();
    expect(within(preview).getByText('defer')).toHaveClass('inline-code');

    await user.click(screen.getByRole('button', { name: 'Import 2 cards' }));
    expect(
      await screen.findByText('Imported 2 flashcards; 0 already existed.'),
    ).toBeInTheDocument();
    const imported = db.questions
      .filter((s) => s.question.type === 'flashcard')
      .map((s) => s.question);
    expect(imported.map((q) => [q.prompt, q.tags])).toEqual([
      ['What is a goroutine?', ['Async & Concurrency']],
      ['What does `defer` do?', ['Imported']],
    ]);
    expect(imported[0].explanation).toBe('A lightweight thread.\nManaged by the Go runtime.');

    await user.click(screen.getByRole('button', { name: 'Import 2 cards' }));
    expect(
      await screen.findByText('Imported 0 flashcards; 2 already existed.'),
    ).toBeInTheDocument();
  });
});

describe('Anki export', () => {
  it('downloads bookmarks as an Anki file', async () => {
    loginAsDemo();
    db.bookmarks.push({
      id: 'b-x',
      userId: 'u1',
      questionId: 'q1',
      createdAt: new Date().toISOString(),
    });
    const files: Blob[] = [];
    URL.createObjectURL = (b: Blob) => {
      files.push(b);
      return 'blob:anki';
    };
    URL.revokeObjectURL = () => {};
    const user = userEvent.setup();
    renderWithProviders(<BookmarksPage />);
    await user.click(await screen.findByRole('button', { name: 'Export to Anki' }));
    await waitFor(() => expect(files).toHaveLength(1));
    const text = await files[0].text(); // a fetch Response blob
    expect(text).toMatch(/^#separator:tab\n/);
    expect(text).toContain('\tcs-trainer-q1');
  });
});
