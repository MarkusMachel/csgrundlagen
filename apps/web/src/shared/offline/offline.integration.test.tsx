import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { QuestionCard } from '@/features/questions/components/QuestionCard';
import { db } from '@/mocks/db';
import { server } from '@/mocks/server';
import { loginAsDemo, loginAsRegularUser, renderWithProviders } from '@/test-utils';

import { enqueueAnswer, flushOutbox, pendingCount, resetOutbox } from './outbox';

afterEach(() => resetOutbox());

const q1 = () => db.questions.find((s) => s.question.id === 'q1')!.question;

describe('answering offline', () => {
  it('grades on the device and queues the answer when the server is unreachable', async () => {
    loginAsDemo();
    server.use(http.post('/api/questions/:id/submit', () => HttpResponse.error()));
    const user = userEvent.setup();
    renderWithProviders(<QuestionCard question={q1()} mode="feed" />);

    await user.click(screen.getByRole('radio', { name: /Transport layer/ }));
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));

    const feedback = await screen.findByTestId('answer-feedback');
    expect(feedback).toHaveTextContent('Correct');
    expect(feedback).toHaveTextContent(/Saved on this device/);
    expect(pendingCount()).toBe(1);
  });

  it('sends queued answers with their original time, only for the user who gave them', async () => {
    const before = db.answerLog.length;
    const answeredAt = new Date(Date.now() - 3600_000).toISOString();
    await enqueueAnswer({ userId: 'u1', questionId: 'q1', answer: 'B', answeredAt });
    await enqueueAnswer({ userId: 'u2', questionId: 'q2', answer: false, answeredAt });
    const bodies: unknown[] = [];
    server.events.on('request:start', async ({ request }) => {
      if (request.url.includes('/submit')) bodies.push(await request.clone().json());
    });

    loginAsDemo();
    expect(await flushOutbox('u1')).toBe(1);
    expect(bodies).toEqual([{ answer: 'B', answeredAt }]);
    expect(pendingCount()).toBe(1); // u2's answer waits for u2
    await waitFor(() => expect(db.answerLog.length).toBe(before + 1));

    loginAsRegularUser();
    expect(await flushOutbox('u2')).toBe(1);
    expect(pendingCount()).toBe(0);
    server.events.removeAllListeners();
  });

  it('keeps answers while still offline, drops ones the server rejects for good', async () => {
    loginAsDemo();
    await enqueueAnswer({
      userId: 'u1',
      questionId: 'q1',
      answer: 'B',
      answeredAt: new Date().toISOString(),
    });
    server.use(http.post('/api/questions/:id/submit', () => HttpResponse.error()));
    expect(await flushOutbox('u1')).toBe(0);
    expect(pendingCount()).toBe(1);

    server.use(
      http.post('/api/questions/:id/submit', () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 }),
      ),
    );
    expect(await flushOutbox('u1')).toBe(0);
    expect(pendingCount()).toBe(0); // the question is gone; retrying won't help
  });
});
