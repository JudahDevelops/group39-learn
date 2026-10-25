/** The Requests panel (src/runners/fastapi/Requests.tsx): the band, the form, the reply and the history. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHistory } from '../../src/runners/fastapi/history';
import { RequestsPanel } from '../../src/runners/fastapi/Requests';
import type { AppView } from '../../src/runners/fastapi/view';
import type { HttpOutcome, HttpRequest } from '../../src/runners/types';

const started: AppView = {
  state: 'started',
  routes: [
    { method: 'GET', path: '/rooms' },
    { method: 'POST', path: '/rooms' },
  ],
  error: null,
  logs: [],
};

const reply = (over: Partial<Extract<HttpOutcome, { kind: 'reply' }>> = {}): HttpOutcome => ({
  kind: 'reply',
  status: 200,
  reason: 'OK',
  contentType: 'application/json',
  location: null,
  body: '[{"number":"A-101","beds":4}]',
  truncated: false,
  ms: 7,
  logs: [],
  error: null,
  ...over,
});

afterEach(cleanup);

const path = () => screen.getByRole('textbox', { name: 'Path' });
const method = () => screen.getByRole('combobox', { name: 'Method' });
const sendButton = () => screen.getByRole('button', { name: 'Send' });

function setup(
  view: AppView | null,
  send: (r: HttpRequest) => Promise<HttpOutcome>,
  running = false,
) {
  const history = createHistory();
  const result = render(
    <RequestsPanel view={view} running={running} send={send} history={history} />,
  );
  return { history, ...result };
}

describe('RequestsPanel: before and after a run', () => {
  it('invites a Run before anything has started, and cannot send', () => {
    setup(null, vi.fn());
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your app has not started. Press Run to start it, then send it a request here.',
    );
    expect(sendButton()).toBeDisabled();
  });

  it('says it is starting while the first run is in progress', () => {
    setup(null, vi.fn(), true);
    expect(screen.getByRole('status')).toHaveTextContent('Starting your app.');
  });

  it('says the app started and how many routes it has, and lists them', () => {
    setup(started, vi.fn());
    expect(screen.getByRole('status')).toHaveTextContent('Your app started with 2 routes.');
    const routes = within(screen.getByRole('list', { name: 'Routes in your app' })).getAllByRole(
      'button',
    );
    expect(routes.map((b) => b.textContent)).toEqual(['GET /rooms', 'POST /rooms']);
    expect(sendButton()).toBeEnabled();
  });

  it('shows the error when the app could not start, with no routes and nothing to send', () => {
    setup(
      { state: 'error', routes: [], error: 'Your code stopped on line 3 of main.py.', logs: [] },
      vi.fn(),
    );
    expect(screen.getByText(/Your code stopped on line 3 of main\.py\./)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Routes in your app' })).toBeNull();
    expect(sendButton()).toBeDisabled();
  });

  it('shows what the app printed while it started', () => {
    setup({ ...started, logs: ['starting up'] }, vi.fn());
    expect(screen.getByText('Printed by your app')).toBeInTheDocument();
    expect(screen.getByText('starting up')).toBeInTheDocument();
  });

  it('cannot send while a run is in progress', () => {
    setup(started, vi.fn(), true);
    expect(sendButton()).toBeDisabled();
  });
});

describe('RequestsPanel: sending', () => {
  it('sends the method, the path and no body for a GET, and shows the status plate and the reply', async () => {
    const send = vi.fn().mockResolvedValue(reply());
    setup(started, send);
    fireEvent.change(path(), { target: { value: 'rooms' } });
    await act(async () => fireEvent.click(sendButton()));
    expect(send).toHaveBeenCalledWith({ method: 'GET', path: '/rooms', body: '' });
    const answer = screen.getByRole('region', { name: 'Reply' });
    expect(within(answer).getByText('200')).toBeInTheDocument();
    expect(within(answer).getByText('OK')).toBeInTheDocument();
    expect(within(answer).getByText('7 ms')).toBeInTheDocument();
    expect(within(answer).getByLabelText('Reply body')).toHaveTextContent(
      '[ { "number": "A-101", "beds": 4 } ]',
    );
    // The path was fixed in the box.
    expect(path()).toHaveValue('/rooms');
  });

  it('shows the body box for POST, PUT and PATCH only, and sends the body', async () => {
    const send = vi.fn().mockResolvedValue(reply({ status: 201, reason: 'Created', body: '{}' }));
    setup(started, send);
    expect(screen.queryByLabelText(/^Body/)).toBeNull();
    fireEvent.change(method(), { target: { value: 'POST' } });
    fireEvent.change(screen.getByLabelText(/^Body/), { target: { value: '{"beds": 2}' } });
    await act(async () => fireEvent.click(sendButton()));
    expect(send).toHaveBeenCalledWith({ method: 'POST', path: '/', body: '{"beds": 2}' });
    // Back to GET: the body is kept in the box but not sent.
    fireEvent.change(method(), { target: { value: 'GET' } });
    await act(async () => fireEvent.click(sendButton()));
    expect(send).toHaveBeenLastCalledWith({ method: 'GET', path: '/', body: '' });
  });

  it('will not send a body that is not JSON, and says why next to the box', () => {
    const send = vi.fn();
    setup(started, send);
    fireEvent.change(method(), { target: { value: 'POST' } });
    const box = screen.getByLabelText(/^Body/);
    fireEvent.change(box, { target: { value: '{"beds": ' } });
    expect(sendButton()).toBeDisabled();
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/^The body is not valid JSON/)).toBeInTheDocument();
    fireEvent.change(box, { target: { value: '' } });
    expect(sendButton()).toBeEnabled();
  });

  it('Ctrl+Enter in the body box sends instead of checking the code', async () => {
    const send = vi.fn().mockResolvedValue(reply());
    setup(started, send);
    fireEvent.change(method(), { target: { value: 'POST' } });
    const box = screen.getByLabelText(/^Body/);
    const notChecked = vi.fn();
    window.addEventListener('keydown', (e) => {
      if (!e.defaultPrevented) notChecked();
    });
    await act(async () => {
      fireEvent.keyDown(box, { key: 'Enter', ctrlKey: true });
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(notChecked).not.toHaveBeenCalled();
  });

  it('a click on a route fills the method and the path', () => {
    setup(started, vi.fn());
    fireEvent.click(screen.getByRole('button', { name: 'POST /rooms' }));
    expect(method()).toHaveValue('POST');
    expect(path()).toHaveValue('/rooms');
  });

  it('marks a 404 with the cross and its code, and shows the handler’s error in plain words', async () => {
    const send = vi.fn().mockResolvedValue(
      reply({
        status: 500,
        reason: 'Internal Server Error',
        body: 'Internal Server Error',
        contentType: 'text/plain',
        error: 'Your code stopped on line 12 of main.py, which reads return totl.',
      }),
    );
    setup(started, send);
    await act(async () => fireEvent.click(sendButton()));
    const answer = screen.getByRole('region', { name: 'Reply' });
    expect(answer.querySelector('.fa-plate-error')).not.toBeNull();
    expect(within(answer).getByText(/Error\. Status/)).toBeInTheDocument();
    expect(within(answer).getByText(/on line 12 of main\.py/)).toBeInTheDocument();
    expect(within(answer).getByLabelText('Reply body')).toHaveTextContent('Internal Server Error');
  });

  it('says so when the reply has no body, and shows where a redirect points', async () => {
    const send = vi
      .fn()
      .mockResolvedValue(
        reply({ status: 307, reason: 'Temporary Redirect', body: '', location: '/rooms' }),
      );
    setup(started, send);
    await act(async () => fireEvent.click(sendButton()));
    expect(screen.getByText('The reply has no body.')).toBeInTheDocument();
    expect(screen.getByText('Location: /rooms')).toBeInTheDocument();
  });

  it('shows what the handler printed under the reply', async () => {
    const send = vi.fn().mockResolvedValue(reply({ logs: ['asked for rooms'] }));
    setup(started, send);
    await act(async () => fireEvent.click(sendButton()));
    expect(screen.getByText('asked for rooms')).toBeInTheDocument();
  });
});

describe('RequestsPanel: when the app is stopped', () => {
  it('a stop notice shows its words, says the app is gone, and cannot send until the next run', async () => {
    const stop =
      'Your code ran for more than 5 seconds, so it was stopped. Check for a loop that never ends.';
    const send = vi.fn().mockResolvedValue({ kind: 'notice', text: stop, appGone: true });
    const { rerender, history } = setup(started, send);
    await act(async () => fireEvent.click(sendButton()));
    expect(
      within(screen.getByRole('region', { name: 'Reply' })).getByText(stop),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your app was stopped. Press Run to start it again.',
    );
    expect(sendButton()).toBeDisabled();
    expect(history.get()[0]).toMatchObject({ method: 'GET', status: null });

    // A new run is a new view: the old reply and the stop are forgotten.
    rerender(<RequestsPanel view={{ ...started }} running={false} send={send} history={history} />);
    expect(sendButton()).toBeEnabled();
    expect(screen.getByText(/The reply appears here/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Your app started with 2 routes.');
  });

  it('a notice that does not stop the app leaves it running', async () => {
    const send = vi
      .fn()
      .mockResolvedValue({ kind: 'notice', text: 'The app did not answer.', appGone: false });
    setup(started, send);
    await act(async () => fireEvent.click(sendButton()));
    expect(sendButton()).toBeEnabled();
  });

  it('a send that throws is shown as a notice, not a crash', async () => {
    const send = vi.fn().mockRejectedValue(new Error('The runner is not available.'));
    setup(started, send);
    await act(async () => fireEvent.click(sendButton()));
    expect(screen.getByText('The runner is not available.')).toBeInTheDocument();
  });
});

describe('RequestsPanel: history', () => {
  it('lists the requests of this session, newest first, with their status, and a click fills the form again', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce(reply())
      .mockResolvedValueOnce(reply({ status: 404, reason: 'Not Found', body: '{"detail":"x"}' }));
    setup(started, send);
    fireEvent.change(path(), { target: { value: '/rooms' } });
    await act(async () => fireEvent.click(sendButton()));
    fireEvent.change(path(), { target: { value: '/rooms/99' } });
    await act(async () => fireEvent.click(sendButton()));

    const list = within(screen.getByRole('region', { name: 'History' })).getAllByRole('button');
    expect(list.map((b) => b.getAttribute('aria-label'))).toEqual([
      'GET /rooms/99, 404. Use again.',
      'GET /rooms, 200. Use again.',
    ]);
    fireEvent.click(list[1]!);
    expect(path()).toHaveValue('/rooms');
  });

  it('is empty, and not shown, before the first request', () => {
    setup(started, vi.fn());
    expect(screen.queryByRole('region', { name: 'History' })).toBeNull();
  });
});
