/**
 * One user journey through the API, run unchanged against the MSW mocks and
 * the real Go API (see mocksVsApi.contract.ts). Every response is recorded so
 * the two runs can be compared step by step. The scenario only relies on data
 * it creates itself, plus one admin account, so it works on an empty database.
 */
import { PRIVACY_POLICY_VERSION } from '@/features/privacy/consent';

export interface Recorded {
  label: string;
  status: number;
  body: unknown;
  /** Paths (see shapeOf) of objects keyed by data. */
  maps?: string[];
}

export interface Backend {
  /** Origin the requests go to, e.g. http://127.0.0.1:18080. */
  origin: string;
  admin: { email: string; password: string };
  /** Sends a request (defaults to fetch). */
  send?: (request: Request) => Promise<Response>;
}

type Actor = 'admin' | 'user' | 'anon';

/** What the scenario reads from responses: ids to use in later steps. */
interface Row {
  id: string;
  email?: string;
}

export async function runScenario(backend: Backend): Promise<Recorded[]> {
  const log: Recorded[] = [];
  const jar: Record<Actor, string | null> = { admin: null, user: null, anon: null };

  async function call<T = Row>(
    label: string,
    actor: Actor,
    method: string,
    path: string,
    body?: unknown,
    maps?: string[],
  ): Promise<T> {
    const cookie = jar[actor];
    const request = new Request(`${backend.origin}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // what a browser adds to a same-origin fetch (the API's CSRF check)
        'Sec-Fetch-Site': 'same-origin',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const res = await (backend.send ?? fetch)(request);
    for (const c of res.headers.getSetCookie()) {
      const value = c.match(/^cft_session=([^;]*)/)?.[1];
      if (value !== undefined) jar[actor] = value ? `cft_session=${value}` : null;
    }
    const text = await res.text();
    let parsed: unknown = null;
    if (text && (res.headers.get('Content-Type') ?? '').includes('json')) parsed = JSON.parse(text);
    else if (text) parsed = '<text>';
    log.push({ label, status: res.status, body: parsed, maps });
    return parsed as T;
  }

  const { admin } = backend;
  const userEmail = `contract-${Date.now()}@example.com`;

  // --- auth ---
  // Setup, not compared: the real admin starts without having accepted the
  // privacy policy (the mock's demo admin has).
  await call('setup login', 'admin', 'POST', '/auth/login', admin);
  await call('setup privacy', 'admin', 'POST', '/me/privacy', { version: PRIVACY_POLICY_VERSION });
  await call('setup logout', 'admin', 'POST', '/auth/logout');
  log.length = 0;

  await call('login wrong password', 'anon', 'POST', '/auth/login', {
    email: admin.email,
    password: 'not-the-password',
  });
  await call('login', 'admin', 'POST', '/auth/login', admin);
  await call('me', 'admin', 'GET', '/auth/me');
  await call('me anonymous', 'anon', 'GET', '/auth/me');
  await call('signup', 'user', 'POST', '/auth/signup', {
    name: 'Contract User',
    email: userEmail,
    password: 'password123',
    locale: 'en',
    acceptPrivacy: true,
  });
  await call('signup duplicate', 'anon', 'POST', '/auth/signup', {
    name: 'Again',
    email: userEmail,
    password: 'password123',
    locale: 'en',
    acceptPrivacy: true,
  });
  await call('signup without privacy consent', 'anon', 'POST', '/auth/signup', {
    name: 'No Consent',
    email: `x-${userEmail}`,
    password: 'password123',
    locale: 'en',
  });

  // --- authoring ---
  const mc = await call('create mc question', 'admin', 'POST', '/questions', {
    type: 'multiple-choice',
    prompt: 'Which OSI layer handles end-to-end delivery?',
    tags: ['Contract', 'Networking'],
    difficulty: 'easy',
    explanation: 'The transport layer.',
    options: [
      { id: 'A', label: 'Network', explanation: 'Routing between hosts.' },
      { id: 'B', label: 'Transport' },
      { id: 'C', label: 'Session' },
    ],
    correctOptionId: 'B',
  });
  const tf = await call('create tf question', 'admin', 'POST', '/questions', {
    type: 'true-false',
    prompt: 'UDP guarantees ordering.',
    tags: ['Contract'],
    explanation: 'It does not.',
    correctAnswer: false,
  });
  await call('create question as user', 'user', 'POST', '/questions', {});
  await call('create invalid question', 'admin', 'POST', '/questions', {
    type: 'multiple-choice',
    prompt: 'x',
    tags: ['t'],
    explanation: 'e',
    options: [{ id: 'A', label: 'only one' }],
    correctOptionId: 'A',
  });
  const material = await call('create material', 'admin', 'POST', '/materials', {
    type: 'book',
    title: 'Computer Networking',
    url: 'https://example.com/book',
    author: 'Kurose',
    tags: ['Networking'],
    relatedQuestionIds: [mc.id],
  });
  await call('update material', 'admin', 'PUT', `/materials/${material.id}`, {
    type: 'book',
    title: 'Computer Networking (8th ed.)',
    url: 'https://example.com/book',
    tags: ['Networking'],
    relatedQuestionIds: [mc.id, tf.id],
  });
  await call('update question', 'admin', 'PUT', `/questions/${tf.id}`, {
    type: 'true-false',
    prompt: 'UDP guarantees in-order delivery.',
    tags: ['Contract'],
    explanation: 'It does not; TCP does.',
    correctAnswer: false,
  });
  const revisions = await call<Row[]>('revisions', 'admin', 'GET', `/questions/${tf.id}/revisions`);
  await call('authoring view', 'admin', 'GET', `/questions/${tf.id}/authoring`);
  const oldest = revisions?.[revisions.length - 1];
  if (oldest) {
    await call(
      'restore revision',
      'admin',
      'POST',
      `/questions/${tf.id}/revisions/${oldest.id}/restore`,
    );
  }

  // --- system design challenges ---
  const designSpec = {
    requirements: [{ id: 'up', text: 'Survive a server failure' }],
    rules: [
      {
        id: 'lb',
        requirement: 'up',
        kind: 'path',
        from: ['client'],
        via: ['load-balancer'],
        to: ['service'],
        text: 'Requests go through a load balancer',
        explanation: 'It routes around failed servers.',
        materialId: material.id,
      },
      {
        id: 'two',
        requirement: 'up',
        kind: 'has',
        of: ['service'],
        min: 2,
        text: 'Two service instances',
        explanation: 'One can fail.',
      },
      {
        id: 'cdn',
        kind: 'has',
        of: ['cdn'],
        optional: true,
        text: 'A CDN',
        explanation: 'Static files load faster.',
      },
    ],
    reference: {
      nodes: [
        { id: 'c', kind: 'client' },
        { id: 'lb', kind: 'load-balancer', label: 'LB' },
        { id: 's1', kind: 'service' },
        { id: 's2', kind: 'service' },
        { id: 'cdn', kind: 'cdn' },
      ],
      edges: [
        { from: 'c', to: 'lb' },
        { from: 'lb', to: 's1' },
        { from: 'lb', to: 's2' },
        { from: 'c', to: 'cdn' },
      ],
    },
  };
  const designBody = {
    type: 'design',
    prompt: 'Design a resilient web app (contract)',
    tags: ['Contract'],
    difficulty: 'medium',
    explanation: 'A load balancer in front of two instances.',
    design: designSpec,
  };
  await call('create design question with failing reference', 'admin', 'POST', '/questions', {
    ...designBody,
    design: { ...designSpec, reference: { nodes: [{ id: 'c', kind: 'client' }], edges: [] } },
  });
  const design = await call('create design question', 'admin', 'POST', '/questions', designBody);
  await call('design list', 'anon', 'GET', '/questions?type=design&pageSize=50');
  await call('get design question', 'anon', 'GET', `/questions/${design.id}`);
  await call('submit good design', 'user', 'POST', `/questions/${design.id}/submit`, {
    answer: {
      nodes: [
        { id: 'a', kind: 'client' },
        { id: 'b', kind: 'load-balancer' },
        { id: 'x', kind: 'service', label: 'api-1' },
        { id: 'y', kind: 'service' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'x' },
        { from: 'b', to: 'y' },
      ],
    },
  });
  await call('submit weak design', 'user', 'POST', `/questions/${design.id}/submit`, {
    answer: { nodes: [{ id: 'a', kind: 'client' }], edges: [] },
  });
  await call('design stats', 'anon', 'GET', `/questions/${design.id}/stats`);
  await call('delete design question', 'admin', 'DELETE', `/questions/${design.id}`);

  // --- browsing ---
  await call('list questions', 'anon', 'GET', '/questions?pageSize=2');
  await call('list by tag', 'user', 'GET', '/questions?tags=Contract&search=udp');
  await call('get question', 'user', 'GET', `/questions/${mc.id}`);
  await call('get question as admin', 'admin', 'GET', `/questions/${mc.id}`);
  await call(
    'get missing question',
    'user',
    'GET',
    '/questions/00000000-0000-0000-0000-000000000000',
  );
  await call('daily question', 'anon', 'GET', '/questions/daily?tz=Europe/Berlin');
  await call('tags', 'anon', 'GET', '/tags');
  await call('search', 'anon', 'GET', '/search?q=transport');
  await call('materials', 'anon', 'GET', '/materials?tags=Networking');
  await call('question materials', 'anon', 'GET', `/questions/${mc.id}/materials`);

  // --- answering ---
  await call('submit wrong', 'user', 'POST', `/questions/${mc.id}/submit`, { answer: 'A' });
  await call('submit right', 'user', 'POST', `/questions/${tf.id}/submit`, { answer: false });
  await call('submit bad type', 'user', 'POST', `/questions/${mc.id}/submit`, { answer: 3 });
  await call('submit anonymous', 'anon', 'POST', `/questions/${mc.id}/submit`, { answer: 'B' });
  await call('question stats', 'anon', 'GET', `/questions/${mc.id}/stats`);
  await call('weak questions', 'user', 'GET', '/questions/weak');
  await call('review queue', 'user', 'GET', '/review/queue');
  await call('progress', 'user', 'GET', '/me/progress');
  await call('bookmark', 'user', 'POST', `/questions/${mc.id}/bookmark`);
  await call('bookmarks', 'user', 'GET', '/bookmarks');
  await call('no note', 'user', 'GET', `/questions/${mc.id}/notes`);
  await call('save note', 'user', 'PUT', `/questions/${mc.id}/notes`, { body: 'layer 4' });
  await call('note', 'user', 'GET', `/questions/${mc.id}/notes`);
  const comment = await call('comment', 'user', 'POST', `/questions/${mc.id}/comments`, {
    body: 'Nice one',
  });
  await call('empty comment', 'user', 'POST', `/questions/${mc.id}/comments`, { body: ' ' });
  await call('comments', 'anon', 'GET', `/questions/${mc.id}/comments`);
  await call('report comment', 'admin', 'POST', `/comments/${comment.id}/report`, {
    reason: 'spam',
    note: 'contract',
  });
  const bug = await call('bug report', 'user', 'POST', `/questions/${mc.id}/bug-reports`, {
    message: 'typo',
  });

  // --- custom tests ---
  const test = await call('create test', 'user', 'POST', '/tests', {
    name: 'Net quiz',
    questionIds: [mc.id, tf.id],
    timed: true,
    durationMinutes: 10,
  });
  await call('create test without duration', 'user', 'POST', '/tests', {
    name: 'x',
    questionIds: [mc.id],
    timed: true,
  });
  await call('list tests', 'user', 'GET', '/tests');
  await call('get test', 'user', 'GET', `/tests/${test.id}`);
  await call('get test of other user', 'admin', 'GET', `/tests/${test.id}`);
  await call('no draft', 'user', 'GET', `/tests/${test.id}/draft`);
  await call(
    'save draft',
    'user',
    'PUT',
    `/tests/${test.id}/draft`,
    {
      mode: 'exam',
      answers: { [mc.id]: 'B' },
      shuffleSeed: 42,
      startedAt: new Date().toISOString(),
    },
    ['$.answers'],
  );
  await call('draft', 'user', 'GET', `/tests/${test.id}/draft`, undefined, ['$.answers']);
  await call('list tests with draft', 'user', 'GET', '/tests');
  await call('delete draft', 'user', 'DELETE', `/tests/${test.id}/draft`);
  await call(
    'submit test',
    'user',
    'POST',
    `/tests/${test.id}/submit`,
    { mode: 'exam', answers: { [mc.id]: 'B' } },
    ['$.attempt.answers'],
  );
  await call('submit test bad mode', 'user', 'POST', `/tests/${test.id}/submit`, { mode: 'x' });
  await call('attempts', 'user', 'GET', `/tests/${test.id}/attempts`, undefined, ['$[].answers']);

  // --- account ---
  await call('consent', 'user', 'POST', '/me/consent', {
    policyVersion: PRIVACY_POLICY_VERSION,
    preferences: true,
    deviceDetails: true,
  });
  await call('save device', 'user', 'POST', '/me/device', {
    timezone: 'Europe/Berlin',
    language: 'de',
    languages: ['de', 'en'],
    screen: '1920x1080',
    viewport: '1440x900',
    pixelRatio: 2,
    touch: false,
    colorScheme: 'dark',
  });
  await call('accept privacy', 'user', 'POST', '/me/privacy', { version: PRIVACY_POLICY_VERSION });
  const sessions = await call<Row[]>('my sessions', 'user', 'GET', '/me/sessions');
  await call('update profile', 'user', 'PATCH', '/me', { name: 'Contract Person', locale: 'de' });
  await call('update profile invalid', 'user', 'PATCH', '/me', { name: '' });
  await call('export my data', 'user', 'GET', '/me/export', undefined, [
    '$.testAttempts[].answers',
  ]);
  await call('anki export', 'user', 'GET', '/export/anki?bookmarks=true');

  // --- admin ---
  await call('admin stats', 'admin', 'GET', '/admin/stats');
  await call('admin stats as user', 'user', 'GET', '/admin/stats');
  await call('quality report', 'admin', 'GET', '/admin/quality');
  await call('bug reports', 'admin', 'GET', '/admin/bug-reports?status=open');
  await call('resolve bug report', 'admin', 'PATCH', `/admin/bug-reports/${bug.id}`, {
    status: 'closed',
  });
  await call('moderation queue', 'admin', 'GET', '/admin/comments?filter=reported');
  await call('hide comment', 'admin', 'PATCH', `/admin/comments/${comment.id}`, { hidden: true });
  await call('import flashcards', 'admin', 'POST', '/admin/import/flashcards', {
    cards: [
      { front: 'What does TCP stand for?', back: 'Transmission Control Protocol', tags: [] },
      { front: '', back: 'missing front', tags: [] },
    ],
    defaultTags: ['Contract'],
  });
  const users = await call<Row[]>('admin users', 'admin', 'GET', '/admin/users');
  const userId = users.find((u) => u.email === userEmail)?.id;
  await call('admin user detail', 'admin', 'GET', `/admin/users/${userId}`);
  await call('delete test of other user', 'admin', 'DELETE', `/tests/${test.id}`);
  await call('delete test', 'user', 'DELETE', `/tests/${test.id}`);
  if (sessions?.[0]) {
    await call(
      'revoke session',
      'admin',
      'DELETE',
      `/admin/users/${userId}/sessions/${sessions[0].id}`,
    );
  }
  const userLogin = { email: userEmail, password: 'password123' };
  await call('user signs in again', 'user', 'POST', '/auth/login', userLogin);
  await call('block user', 'admin', 'PATCH', `/admin/users/${userId}`, { blocked: true });
  await call('blocked user request', 'user', 'GET', '/auth/me');
  await call('blocked user login', 'user', 'POST', '/auth/login', userLogin);
  await call('unblock user', 'admin', 'PATCH', `/admin/users/${userId}`, { blocked: false });
  await call('revoke all sessions', 'admin', 'DELETE', `/admin/users/${userId}/sessions`);
  await call('delete material', 'admin', 'DELETE', `/materials/${material.id}`);
  await call('delete question', 'admin', 'DELETE', `/questions/${tf.id}`);
  await call('delete user', 'admin', 'DELETE', `/admin/users/${userId}`);
  await call('logout', 'admin', 'POST', '/auth/logout');
  await call('me after logout', 'admin', 'GET', '/auth/me');

  return log;
}
