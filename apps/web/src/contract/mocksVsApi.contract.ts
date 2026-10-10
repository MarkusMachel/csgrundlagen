/**
 * Contract check: the MSW mocks the web app is developed against must answer
 * like the real Go API. Runs the same scenario against both and compares,
 * step by step, the status code and the JSON shape (types, not values).
 *
 * Needs a running API on an empty database with one admin account; use
 * `npm run contract` (scripts/contract.sh), which sets that up.
 */
import { getResponse } from 'msw';
import { beforeAll, describe, expect, it } from 'vitest';

import { resetDb } from '@/mocks/db';
import { handlers } from '@/mocks/handlers';

import { type Recorded, runScenario } from './scenario';
import { diffShapes, shapeOf } from './shape';

const apiOrigin = process.env.CONTRACT_API_URL;

describe.skipIf(!apiOrigin)('mocks match the real API', () => {
  let mock: Recorded[] = [];
  let api: Recorded[] = [];

  beforeAll(async () => {
    resetDb();
    // The handlers are called directly: MSW's interception keeps a cookie
    // store of its own, which would mix up the scenario's users.
    mock = await runScenario({
      origin: location.origin,
      admin: { email: 'demo@example.com', password: 'password' },
      send: async (request) => {
        // MSW's HttpResponse copies Set-Cookie into the page cookie, which the
        // mock falls back to; the scenario carries cookies itself.
        document.cookie = 'cft_session=; path=/; max-age=0';
        try {
          return (
            (await getResponse(handlers, request)) ??
            Response.json({ message: 'no mock handler' }, { status: 501 })
          );
        } catch (err) {
          // a crashing handler is a 500, like a panic in the API
          return Response.json({ message: String(err) }, { status: 500 });
        }
      },
    });
    api = await runScenario({
      origin: apiOrigin!,
      admin: {
        email: process.env.CONTRACT_ADMIN_EMAIL ?? 'contract-admin@example.com',
        password: process.env.CONTRACT_ADMIN_PASSWORD ?? 'contract-password',
      },
    });
  }, 60_000);

  it('ran the same steps', () => {
    expect(mock.map((s) => s.label)).toEqual(api.map((s) => s.label));
  });

  it('answers every step with the same status and shape', () => {
    const problems: string[] = [];
    mock.forEach((m, i) => {
      const a = api[i];
      if (!a) return;
      if (m.status !== a.status) {
        problems.push(`${m.label}: status mock ${m.status}, api ${a.status}`);
        return;
      }
      for (const d of diffShapes(shapeOf(m.body, m.maps), shapeOf(a.body, a.maps))) {
        problems.push(`${m.label}: ${d}`);
      }
    });
    expect(problems).toEqual([]);
  });
});
