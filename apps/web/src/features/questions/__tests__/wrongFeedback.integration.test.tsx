import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { QuestionForm } from '@/features/authoring';
import { db } from '@/mocks/db';
import { loginAsDemo, renderWithProviders } from '@/test-utils';

import { QuestionCard } from '../components/QuestionCard';

describe('wrong-answer feedback (integration)', () => {
  it('an admin writes it per option; a learner who picks that option sees it, nobody else does', async () => {
    loginAsDemo();
    const user = userEvent.setup();
    const q = db.questions.find((s) => s.question.id === 'q1')!.question;
    if (q.type !== 'multiple-choice') throw new Error('q1 is multiple choice');
    const wrong = q.options.find((o) => o.id !== q.correctOptionId)!;
    const material = db.materials[0];

    // --- authoring ---
    const form = renderWithProviders(<QuestionForm question={q} />);
    // the first wrong option's feedback sits in a collapsed <details>
    await user.click((await screen.findAllByText(/If someone picks this/))[0]);
    const editor = screen.getByLabelText(`Why option ${wrong.id} is wrong`);
    await user.type(editor, 'Zebra-feedback: that layer is hop by hop.');
    await user.click(
      screen.getByRole('button', { name: new RegExp(`^Reading for option ${wrong.id}`) }),
    );
    await user.type(screen.getByPlaceholderText('Search materials…'), material.title.slice(0, 12));
    await user.click(screen.getByRole('option', { name: material.title }));
    await user.click(screen.getByRole('button', { name: /Save changes/ }));
    await waitFor(() =>
      expect(db.optionFeedback.q1?.[wrong.id]).toEqual({
        feedback: 'Zebra-feedback: that layer is hop by hop.',
        materialId: material.id,
      }),
    );
    form.unmount();

    // the public question carries no feedback
    const saved = db.questions.find((s) => s.question.id === 'q1')!.question;
    expect(JSON.stringify(saved)).not.toContain('Zebra-feedback');

    // --- answering wrong ---
    renderWithProviders(<QuestionCard question={saved} mode="feed" />);
    await user.click(screen.getByRole('radio', { name: new RegExp(wrong.label.slice(0, 15)) }));
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));
    const fb = await screen.findByTestId('wrong-answer-feedback');
    expect(fb).toHaveTextContent('Zebra-feedback: that layer is hop by hop.');
    expect(
      within(fb).getByRole('link', { name: new RegExp(`Read: ${material.title.slice(0, 12)}`) }),
    ).toHaveAttribute('href', material.url);
  });
});
