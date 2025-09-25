/*
  Probe endpoints utility: run with ts-node or tsx
  Example:
    npx tsx scripts/probeEndpoints.ts
*/

/* eslint-disable no-undef */
import axios from 'axios';

const baseURL = (process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const sampleId = parseInt(process.env.PROBE_ID || '1', 10);

const paths: Array<[string, string]> = [
  ['health', '/api/health/'],
  ['docs', '/api/docs/'],
  ['schema', '/api/schema/'],

  ['login', '/api/auth/login/'],
  ['refresh', '/api/auth/refresh/'],
  ['register', '/api/auth/register/'],
  ['me', '/api/me/'],
  ['users', '/api/users/'],

  ['events', '/api/events/'],
  ['event-sample', `/api/events/${sampleId}/`],
  ['event-announce', `/api/events/${sampleId}/announce/`],
  ['event-cancel', `/api/events/${sampleId}/cancel/`],
  ['event-fixtures', `/api/events/${sampleId}/fixtures/`],
  ['event-gen-fixtures', `/api/events/${sampleId}/fixtures/generate/`],
  ['event-leaderboard', `/api/events/${sampleId}/leaderboard/`],

  ['venues', '/api/venues/'],
  ['venue-sample', `/api/venues/${sampleId}/`],
  ['venue-slots', `/api/venues/${sampleId}/slots/`],
  ['sports', '/api/sports/'],

  ['public-events', '/api/public/events/'],
  ['public-event', `/api/public/events/${sampleId}/`],
  ['public-event-fixtures', `/api/public/events/${sampleId}/fixtures/`],
  ['public-event-results', `/api/public/events/${sampleId}/results/`],
  ['public-event-leaderboard', `/api/public/events/${sampleId}/leaderboard/`],

  ['registrations', '/api/registrations/'],
  ['registration-sample', `/api/registrations/${sampleId}/`],
  ['registration-docs', `/api/registrations/${sampleId}/documents/`],

  ['fixtures', '/api/fixtures/'],
  ['results', '/api/results/'],
  ['result-sample', `/api/results/${sampleId}/`],

  ['news', '/api/news/'],
  ['news-item', '/api/news/1/'],
  ['gallery-albums', '/api/gallery/albums/'],
  ['gallery-media', '/api/gallery/media/'],
  ['media-item', `/api/gallery/media/${sampleId}/`],

  ['checkout', '/api/tickets/checkout/'],
  ['my-tickets', '/api/tickets/me/tickets/'],
  ['ticket-qr', `/api/tickets/tickets/${sampleId}/qr/`],
  ['ticket-use', `/api/tickets/tickets/${sampleId}/use/`],
  ['verify', '/api/tickets/verify/'],

  ['notifications', '/api/notifications/'],
  ['threads', '/api/notifications/threads/'],
  ['messages', '/api/notifications/messages/'],

  ['sse-event', `/api/events/${sampleId}/stream/`],
  ['sse-event-results', `/api/events/${sampleId}/results/stream/`],
];

function statusLabel(status: number | 'ERR' | 'TIMEOUT') {
  if (status === 'ERR') return 'ERR ';
  if (status === 'TIMEOUT') return 'TO  ';
  if (status === 200) return '200 ';
  if (status === 401) return '401 ';
  if (status === 403) return '403 ';
  if (status === 404) return '404 ';
  return String(status).padEnd(4, ' ');
}

async function probe(path: string) {
  try {
    const url = baseURL + path;
    const response = await axios.get(url, { validateStatus: () => true, timeout: 5000 });
    return response.status;
  } catch (e: any) {
    if (e.code === 'ECONNABORTED') return 'TIMEOUT';
    return 'ERR';
  }
}

async function main() {
  console.log(`Probing against ${baseURL}`);
  const entries = await Promise.all(paths.map(async ([name, path]) => {
    const status = await probe(path);
    return { name, path, status } as const;
  }));

  for (const e of entries) {
    const label = statusLabel(e.status);
    console.log(`${label} ${e.path}    (${e.name})`);
  }

  const missing = entries.filter(e => e.status === 404);
  if (missing.length) {
    console.log('\n404 endpoints found. Update src/api/ENDPOINTS.ts with correct paths and re-run.');
  } else {
    console.log('\nAll endpoints exist (200/401/403).');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


