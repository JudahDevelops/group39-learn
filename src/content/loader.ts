/**
 * Lazy, cached access to the built content in public/content. Types only: nothing is re-validated
 * in the browser (scripts/validate-content.ts already did that at build time).
 */
import type { Block, CurriculumIndex } from './schema';

type Fetch = (input: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

export interface ContentLoader {
  fetchCurriculum(): Promise<CurriculumIndex>;
  fetchBlock(slug: string): Promise<Block>;
  /** Forget everything cached (tests, or after a content refresh). */
  clear(): void;
}

export function createContentLoader(
  fetchFn: Fetch = (url) => fetch(url),
  base: string = import.meta.env.BASE_URL,
): ContentLoader {
  const root = base.endsWith('/') ? base : `${base}/`;
  const cache = new Map<string, Promise<unknown>>();

  function get<T>(path: string): Promise<T> {
    const hit = cache.get(path);
    if (hit) return hit as Promise<T>;
    const request = fetchFn(`${root}content/${path}`).then(async (res) => {
      if (!res.ok) throw new Error(`Could not load content/${path} (HTTP ${res.status})`);
      return (await res.json()) as T;
    });
    // A failed request must not stay cached, or the learner could never retry.
    request.catch(() => cache.delete(path));
    cache.set(path, request);
    return request;
  }

  return {
    fetchCurriculum: () => get<CurriculumIndex>('curriculum.json'),
    fetchBlock: (slug) => get<Block>(`blocks/${encodeURIComponent(slug)}.json`),
    clear: () => cache.clear(),
  };
}

const defaultLoader = createContentLoader();

export const fetchCurriculum = defaultLoader.fetchCurriculum;
export const fetchBlock = defaultLoader.fetchBlock;
export const clearContentCache = defaultLoader.clear;
