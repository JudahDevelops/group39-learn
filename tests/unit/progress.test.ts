import { beforeEach, describe, expect, it } from 'vitest';
import { completeItem, onProgress } from '../../src/lib/progress';
import { LocalStore } from '../../src/store/LocalStore';

describe('completeItem', () => {
  let store: LocalStore;
  beforeEach(async () => {
    localStorage.clear();
    store = new LocalStore();
    await store.signIn('ada@example.com', 'pw');
  });

  it('marks the item done, awards each reason once and reports XP gained', async () => {
    expect(await completeItem(store, 'lesson-1', 'block-1', ['lesson', 'lesson_perfect'])).toBe(15);
    expect(await completeItem(store, 'lesson-1', 'block-1', ['lesson', 'lesson_perfect'])).toBe(0);
    const done = await store.listCompleted(store.getCurrentUser()!.id);
    expect(done.map((p) => p.itemId)).toEqual(['lesson-1']);
  });

  it('notifies progress listeners, and stops after unsubscribe', async () => {
    let calls = 0;
    const off = onProgress(() => {
      calls += 1;
    });
    await completeItem(store, 'step-1', 'block-2', ['step']);
    off();
    await completeItem(store, 'step-2', 'block-2', ['step']);
    expect(calls).toBe(1);
  });
});
