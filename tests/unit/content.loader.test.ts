import { describe, expect, it, vi } from 'vitest';
import { createContentLoader } from '../../src/content/loader';

function fakeFetch(responses: Record<string, unknown>) {
  const calls: string[] = [];
  const fn = vi.fn(async (url: string) => {
    calls.push(url);
    if (url in responses) return { ok: true, status: 200, json: async () => responses[url] };
    return { ok: false, status: 404, json: async () => ({}) };
  });
  return { fn, calls };
}

describe('content loader', () => {
  it('fetches the curriculum once and serves later calls from memory', async () => {
    const { fn, calls } = fakeFetch({ '/content/curriculum.json': { tracks: [] } });
    const loader = createContentLoader(fn, '/');
    const [a, b] = await Promise.all([loader.fetchCurriculum(), loader.fetchCurriculum()]);
    await loader.fetchCurriculum();
    expect(a).toEqual({ tracks: [] });
    expect(a).toBe(b);
    expect(calls).toEqual(['/content/curriculum.json']);
  });

  it('fetches each block lazily and caches it separately', async () => {
    const { fn, calls } = fakeFetch({
      '/content/blocks/one.json': { type: 'review', slug: 'one' },
      '/content/blocks/two.json': { type: 'review', slug: 'two' },
    });
    const loader = createContentLoader(fn, '/');
    expect(calls).toEqual([]);
    expect(await loader.fetchBlock('one')).toMatchObject({ slug: 'one' });
    expect(await loader.fetchBlock('one')).toMatchObject({ slug: 'one' });
    expect(await loader.fetchBlock('two')).toMatchObject({ slug: 'two' });
    expect(calls).toEqual(['/content/blocks/one.json', '/content/blocks/two.json']);
  });

  it('honours a base path without a trailing slash', async () => {
    const { fn, calls } = fakeFetch({ '/learn/content/curriculum.json': { tracks: [] } });
    await createContentLoader(fn, '/learn').fetchCurriculum();
    expect(calls).toEqual(['/learn/content/curriculum.json']);
  });

  it('does not cache a failure, so a retry can succeed', async () => {
    let ok = false;
    const fn = vi.fn(async () => ({
      ok,
      status: ok ? 200 : 500,
      json: async () => ({ tracks: [] }),
    }));
    const loader = createContentLoader(fn, '/');
    await expect(loader.fetchCurriculum()).rejects.toThrow(/HTTP 500/);
    ok = true;
    await expect(loader.fetchCurriculum()).resolves.toEqual({ tracks: [] });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('rejects with a readable error for an unknown block', async () => {
    const { fn } = fakeFetch({});
    await expect(createContentLoader(fn, '/').fetchBlock('nope')).rejects.toThrow(
      /content\/blocks\/nope\.json \(HTTP 404\)/,
    );
  });

  it('clear() forgets cached content', async () => {
    const { fn } = fakeFetch({ '/content/curriculum.json': { tracks: [] } });
    const loader = createContentLoader(fn, '/');
    await loader.fetchCurriculum();
    loader.clear();
    await loader.fetchCurriculum();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
