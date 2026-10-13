/** The request and response walk-through (lesson 3.1): props, phases and the text shown in the code style. */
import { describe, expect, it } from 'vitest';
import {
  formatJson,
  parseExchangeProps,
  phaseAt,
  requestText,
  responseText,
  tiersOf,
  turnIndex,
} from '../../src/screens/widgets/exchange';

/** The request and response of lesson 3.1. */
const COMPLAINT = {
  request: {
    method: 'POST',
    path: '/api/complaints',
    body: { description: 'Water is pouring from the ceiling near the light' },
  },
  response: {
    status: 201,
    statusText: 'Created',
    body: {
      id: 482,
      category: 'plumbing',
      urgency: 'urgent',
      deadline: '2026-10-08T10:00:00+01:00',
      status: 'Open',
    },
  },
  stops: [
    { label: 'The browser sends the request', tier: 'Browser' },
    { label: 'The server applies the rules', tier: 'Server' },
    { label: 'The database stores the complaint', tier: 'Database' },
    { label: 'The server builds the response', tier: 'Server' },
    { label: 'The browser shows the response', tier: 'Browser' },
  ],
};

describe('parseExchangeProps', () => {
  it('reads the lesson 3.1 example', () => {
    const exchange = parseExchangeProps(COMPLAINT);
    expect(exchange.tiers).toEqual(['Browser', 'Server', 'Database']);
    expect(exchange.stops).toHaveLength(5);
    expect(exchange.request.method).toBe('POST');
    expect(exchange.response.status).toBe(201);
  });

  it('a request with no body is fine (a GET)', () => {
    const exchange = parseExchangeProps({
      ...COMPLAINT,
      request: { method: 'GET', path: '/api/complaints/482' },
    });
    expect(exchange.request.body).toBeNull();
    expect(requestText(exchange.request)).toBe('GET /api/complaints/482');
  });

  it.each([
    ['not an object', 5],
    ['no request', { ...COMPLAINT, request: undefined }],
    ['an unknown method', { ...COMPLAINT, request: { ...COMPLAINT.request, method: 'FETCH' } }],
    ['a lower-case method', { ...COMPLAINT, request: { ...COMPLAINT.request, method: 'post' } }],
    [
      'a path with no leading slash',
      { ...COMPLAINT, request: { ...COMPLAINT.request, path: 'api' } },
    ],
    ['a body that is text', { ...COMPLAINT, request: { ...COMPLAINT.request, body: 'hello' } }],
    ['no response', { ...COMPLAINT, response: undefined }],
    ['a status below 100', { ...COMPLAINT, response: { ...COMPLAINT.response, status: 20 } }],
    [
      'a status given as text',
      { ...COMPLAINT, response: { ...COMPLAINT.response, status: '201' } },
    ],
    ['no status text', { ...COMPLAINT, response: { ...COMPLAINT.response, statusText: '' } }],
    ['too few stops', { ...COMPLAINT, stops: COMPLAINT.stops.slice(0, 2) }],
    ['a stop with no label', { ...COMPLAINT, stops: [...COMPLAINT.stops, { tier: 'Server' }] }],
    [
      'only one tier',
      { ...COMPLAINT, stops: COMPLAINT.stops.map((s) => ({ ...s, tier: 'Server' })) },
    ],
    ['stops that never come back', { ...COMPLAINT, stops: COMPLAINT.stops.slice(0, 3) }],
  ])('throws for %s', (_what, bad) => {
    expect(() => parseExchangeProps(bad)).toThrow();
  });
});

describe('stops', () => {
  const { stops } = parseExchangeProps(COMPLAINT);

  it('lists the tiers in the order the request reaches them', () => {
    expect(tiersOf(stops)).toEqual(['Browser', 'Server', 'Database']);
  });

  it('the request turns round at the first stop in the deepest tier', () => {
    expect(turnIndex(stops)).toBe(2);
  });

  it('stops up to the turn are the request, later ones the response', () => {
    expect([0, 1, 2, 3, 4].map((i) => phaseAt(stops, i))).toEqual([
      'request',
      'request',
      'request',
      'response',
      'response',
    ]);
  });

  it('works for a server that never reaches the database', () => {
    const short = parseExchangeProps({
      ...COMPLAINT,
      stops: [COMPLAINT.stops[0], COMPLAINT.stops[1], COMPLAINT.stops[4]],
    }).stops;
    expect(turnIndex(short)).toBe(1);
    expect(phaseAt(short, 2)).toBe('response');
  });
});

describe('text shown in the code style', () => {
  const { request, response } = parseExchangeProps(COMPLAINT);

  it('the request is the method and path, then the JSON body, as in the lesson', () => {
    expect(requestText(request)).toBe(
      'POST /api/complaints\n{\n  "description": "Water is pouring from the ceiling near the light"\n}',
    );
  });

  it('the response is the status and its text, then the JSON body, as in the lesson', () => {
    expect(responseText(response)).toBe(
      [
        '201 Created',
        '{',
        '  "id": 482,',
        '  "category": "plumbing",',
        '  "urgency": "urgent",',
        '  "deadline": "2026-10-08T10:00:00+01:00",',
        '  "status": "Open"',
        '}',
      ].join('\n'),
    );
  });

  it('formatJson indents by two spaces', () => {
    expect(formatJson({ a: [1] })).toBe('{\n  "a": [\n    1\n  ]\n}');
  });
});
