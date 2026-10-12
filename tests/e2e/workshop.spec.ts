import { expect, test, type Page } from '@playwright/test';
import { signInAndOnboard } from './helpers';

const STEP_1 = '/learn/fixture-workshop/scwu02e0';
const STEP_2 = '/learn/fixture-workshop/xi2gtaxb';
const STEP_3 = '/learn/fixture-workshop/9oqc00jd';

const check = (page: Page) => page.getByRole('button', { name: 'Check your code' });
const slip = (page: Page) => page.locator('.wk-slip-region');
const editorText = (page: Page) => page.locator('.cm-content').innerText();

/** Click the first editable line and type there. */
async function typeInRegion(page: Page, text: string) {
  await page.locator('.cm-line-editable').first().click();
  await page.keyboard.type(text);
}

test.beforeEach(async ({ page }) => {
  await signInAndOnboard(page);
});

test('step 1 fails, then passes, then Continue opens step 2', async ({ page }) => {
  await page.goto(STEP_1);
  await expect(page.getByRole('heading', { level: 1, name: 'Build a Hall Notice' })).toBeVisible();
  await expect(page.getByText('Step 1 of 3', { exact: true })).toBeVisible();
  const topbar = page.locator('header.topbar');
  await expect(topbar.getByText('0 of 60 XP today')).toBeVisible();

  // An empty page fails the first test, and only that message shows.
  await check(page).click();
  await expect(slip(page)).toHaveText(
    /Not passing yet\. Your page should have exactly one h1 element\./,
  );
  await expect(page.getByText('Your code passes.')).toBeHidden();

  // An h1 without its closing tag fails a later test.
  await typeInRegion(page, '<h1>Hall Notice');
  await check(page).click();
  await expect(slip(page)).toHaveText(/Your h1 element needs a closing tag\./);

  // Finish the tag and check with the keyboard.
  await page.locator('.cm-line-editable').first().click();
  await page.keyboard.press('End');
  await page.keyboard.type('</h1>');
  await page.keyboard.press('Control+Enter');
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(page.getByText('Step 1 of 3 done')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(topbar.getByText('5 of 60 XP today')).toBeVisible();

  // Ctrl+Enter again continues.
  await page.keyboard.press('Control+Enter');
  await expect(page).toHaveURL(STEP_2);
  await expect(page.getByText('Step 2 of 3', { exact: true })).toBeVisible();
  // Step 2 starts from step 1's solution, with its own empty region.
  await expect(page.locator('.cm-content')).toContainText('<h1>Hall Notice</h1>');
});

test('the Continue button works too, and passing twice pays XP once', async ({ page }) => {
  await page.goto(STEP_1);
  await typeInRegion(page, '<h1>Hall Notice</h1>');
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await check(page).click();
  await expect(page.getByText('Your code passes.')).toBeVisible();
  await expect(page.locator('header.topbar').getByText('5 of 60 XP today')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(STEP_2);
});

test('typing in a locked line changes nothing', async ({ page }) => {
  await page.goto(STEP_1);
  const before = await editorText(page);

  // Locked line: the doctype.
  await page.locator('.cm-line-locked').first().click();
  await page.keyboard.press('End');
  await page.keyboard.type('zzz');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Delete');
  expect(await editorText(page)).toBe(before);
  await expect(
    page.getByText('That part is locked. Type inside the highlighted lines.'),
  ).toBeVisible();

  // Select everything and type: only the editable lines are replaced, and typing carries on in order.
  await page.keyboard.press('Control+A');
  await page.keyboard.type('abc');
  await expect(page.locator('.cm-line-editable')).toHaveText('abc');
  const typed = await editorText(page);
  expect(typed).toContain('<!DOCTYPE html>');
  expect(typed).toContain('<title>Hall Notice</title>');
  expect(typed).toContain('</html>');
  // Select everything and delete: the editable lines empty out, the locked ones stay.
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  expect(await editorText(page)).toBe(before);

  // The edges of the region cannot be joined to the locked lines around it.
  await page.locator('.cm-line-editable').first().click();
  await page.keyboard.press('Home');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('End');
  await page.keyboard.press('Delete');
  expect(await editorText(page)).toBe(before);

  // The editable line still works.
  await page.keyboard.type('ok');
  expect(await editorText(page)).toContain('ok');
});

test('locked lines are dimmed and the editable lines carry the brass bar', async ({ page }) => {
  await page.goto(STEP_1);
  const locked = page.locator('.cm-line-locked').first();
  await expect(locked).toHaveCSS('opacity', '0.6');
  const editable = page.locator('.cm-line-editable').first();
  await expect(editable).toHaveCSS('background-color', 'rgb(30, 45, 39)');
  const bar = page.locator('.cm-gutterElement.cm-gutter-editable').first();
  await expect(bar).toHaveCSS('box-shadow', /rgb\(233, 184, 36\) 3px 0px 0px 0px inset/);
  // The region grows with the text: two new lines make three editable lines.
  await typeInRegion(page, 'a\nb');
  await expect(page.locator('.cm-line-editable')).toHaveCount(2);
});

test('the editor uses Atkinson Hyperlegible Mono', async ({ page }) => {
  await page.goto(STEP_1);
  await expect(page.locator('.cm-content')).toHaveCSS('font-family', /Atkinson Hyperlegible Mono/);
});

test('hints reveal in order, and Help offers WhatsApp and the integrity line', async ({ page }) => {
  await page.goto(STEP_1);
  await typeInRegion(page, '<h1>Hall');
  await page.getByRole('button', { name: 'Help' }).click();
  const dialog = page.getByRole('dialog', { name: 'Help' });
  await expect(dialog).toBeVisible();

  await expect(dialog.getByText('Hint 1', { exact: true })).toBeHidden();
  await dialog.getByRole('button', { name: 'Show hint 1' }).click();
  await expect(
    dialog.getByText('An element has an opening tag, the text, and a closing tag.'),
  ).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Show hint 1' })).toBeHidden();
  await expect(dialog.getByText('The opening tag is')).toBeHidden();

  await dialog.getByRole('button', { name: 'Show hint 2' }).click();
  await expect(dialog.getByText('The opening tag is')).toBeVisible();
  await expect(dialog.getByText('on the empty line inside the')).toBeHidden();

  await dialog.getByRole('button', { name: 'Show hint 3' }).click();
  await expect(dialog.getByText('on the empty line inside the')).toBeVisible();
  await expect(dialog.getByRole('button', { name: /Show hint/ })).toBeHidden();

  await expect(
    dialog.getByText('AI may explain code to you, but it must not write it.'),
  ).toBeVisible();

  const link = dialog.getByRole('link', { name: 'Ask the group on WhatsApp' });
  await expect(link).toHaveAttribute('target', '_blank');
  const href = (await link.getAttribute('href')) ?? '';
  expect(href.startsWith('https://wa.me/?text=')).toBe(true);
  const text = decodeURIComponent(href.slice('https://wa.me/?text='.length));
  expect(text).toContain('Step 1');
  expect(text).toContain(page.url());
  expect(text).toContain('<h1>Hall');

  // Hints stay revealed after closing; Escape closes and focus returns to Help.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Help' })).toBeFocused();
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Help' }).getByText('Hint 3', { exact: true }),
  ).toBeVisible();
});

test('step 1 shows the finished project; step 2 does not', async ({ page }) => {
  await page.goto(STEP_1);
  await page.getByRole('button', { name: 'See the finished project' }).click();
  const dialog = page.getByRole('dialog', { name: 'The finished project' });
  await expect(dialog).toBeVisible();
  const frame = dialog.frameLocator('iframe');
  await expect(frame.getByRole('heading', { name: 'Hall Notice' })).toBeVisible();
  await expect(frame.getByRole('paragraph')).toContainText('Water will be off in Hall A');
  await expect(frame.getByRole('button', { name: 'Got it' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();

  await page.goto(STEP_2);
  await expect(page.getByRole('button', { name: 'See the finished project' })).toBeHidden();
});

test('the preview shows the learner page and the preview frame is sandboxed', async ({ page }) => {
  await page.goto(STEP_2);
  const frameElement = page.locator('iframe[title="Preview of your page"]');
  const sandbox = (await frameElement.getAttribute('sandbox')) ?? '';
  expect(sandbox.split(' ').sort()).toEqual(['allow-modals', 'allow-scripts']);
  await expect(
    page
      .frameLocator('iframe[title="Preview of your page"]')
      .getByRole('heading', { name: 'Hall Notice' }),
  ).toBeVisible();

  // It follows what the learner types.
  await typeInRegion(page, '<p>Live preview</p>');
  await expect(
    page.frameLocator('iframe[title="Preview of your page"]').getByText('Live preview'),
  ).toBeVisible();
});

test('Reset step asks first', async ({ page }) => {
  await page.goto(STEP_1);
  await typeInRegion(page, '<h1>Hall Notice</h1>');
  await page.getByRole('button', { name: 'Reset step' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('Reset this step to its starting code?')).toBeVisible();

  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  expect(await editorText(page)).toContain('<h1>Hall Notice</h1>');

  await page.getByRole('button', { name: 'Reset step' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset step' }).click();
  await expect(page.locator('.cm-content')).not.toContainText('<h1>Hall Notice</h1>');
  // And the editor still works afterwards.
  await typeInRegion(page, 'again');
  await expect(page.locator('.cm-content')).toContainText('again');
});

test('code is saved and restored, and attempts are recorded', async ({ page }) => {
  await page.goto(STEP_1);
  await typeInRegion(page, '<h1>Saved text');
  await page.waitForTimeout(1300);
  await page.reload();
  await expect(page.locator('.cm-content')).toContainText('<h1>Saved text');
  // The locked lines are still locked after restoring.
  const before = await editorText(page);
  await page.locator('.cm-line-locked').first().click();
  await page.keyboard.type('zzz');
  expect(await editorText(page)).toBe(before);

  await check(page).click();
  await expect(slip(page)).toHaveText(/Your h1 element should have the text Hall Notice\./);
  const attempts = await page.evaluate(() => {
    const raw = Object.entries(localStorage).find(([key]) => /attempts/i.test(key));
    return raw
      ? (JSON.parse(raw[1]) as {
          itemId: string;
          passed: boolean;
          failedTestIndex: number | null;
        }[])
      : [];
  });
  expect(attempts.at(-1)).toMatchObject({ itemId: 'scwu02e0', passed: false, failedTestIndex: 1 });
});

test('the last step ends in a Workshop done card', async ({ page }) => {
  await page.goto(STEP_3);
  await typeInRegion(page, '<button>Got it</button>');
  await check(page).click();
  await expect(page.getByText('Step 3 of 3 done')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Workshop done' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL('/learn');
});

test('a syntax error in the learner JavaScript is explained in plain words', async ({ page }) => {
  await page.goto(STEP_1);
  await typeInRegion(page, '<h1>Hall Notice</h1><script>var x = ;</script>');
  await check(page).click();
  await expect(slip(page)).toHaveText(/Your JavaScript has a syntax error/);
  await expect(slip(page)).not.toHaveText(/Uncaught|SyntaxError/);
});

test('a loop that never ends is stopped and explained, and the page stays usable', async ({
  page,
}) => {
  await page.goto(STEP_1);
  await typeInRegion(page, '<h1>Hall Notice</h1><script>while(true){}</script>');
  await check(page).click();
  await expect(slip(page)).toContainText(
    'Your loop ran for more than 1.5 seconds, so it was stopped.',
    {
      timeout: 15000,
    },
  );
  await expect(page.getByText('Your code passes.')).toBeHidden();

  // Fix it and pass.
  await page.locator('.cm-line-editable').first().click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('<h1>Hall Notice</h1>');
  await page.keyboard.press('Control+Enter');
  await expect(page.getByText('Your code passes.')).toBeVisible({ timeout: 15000 });
});

test('console.log shows in the Console tab, and a page with JavaScript gets a Run button', async ({
  page,
}) => {
  await page.goto(STEP_1);
  // A page without JavaScript refreshes as you type, so it has no Run button.
  await typeInRegion(page, '<h1>Hall Notice</h1>');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeHidden();

  await page.keyboard.type('<script>console.log("hello from the page")</script>');
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Run', exact: true }).click();
  const consoleTab = page.getByRole('tab', { name: /^Console/ });
  await expect(consoleTab).toHaveText('Console (1)');
  await consoleTab.click();
  await expect(page.getByRole('log', { name: 'Console output' })).toHaveText('hello from the page');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(
    page
      .frameLocator('iframe[title="Preview of your page"]')
      .getByRole('heading', { name: 'Hall Notice' }),
  ).toBeVisible();
});

test.describe('layouts', () => {
  test('wide: three panes at 30/40/30, and the dividers drag', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(STEP_1);
    await page.evaluate(() => localStorage.removeItem('g39.workshop.panes'));
    await page.reload();
    const grid = page.locator('.wk-grid');
    const total = (await grid.boundingBox())!.width;
    const instructions = page.locator('.wk-instructions');
    const editor = page.locator('.wk-editor');
    const output = page.locator('.wk-output-pane');
    expect((await instructions.boundingBox())!.width / total).toBeCloseTo(0.3, 1);
    expect((await editor.boundingBox())!.width / total).toBeCloseTo(0.4, 1);
    expect((await output.boundingBox())!.width / total).toBeCloseTo(0.3, 1);

    const before = (await instructions.boundingBox())!.width;
    const divider = page.getByRole('separator', { name: 'Resize instructions and editor' });
    const box = (await divider.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + 200, { steps: 6 });
    await page.mouse.up();
    expect((await instructions.boundingBox())!.width).toBeGreaterThan(before + 90);

    // Keyboard: the divider takes arrow keys too.
    await divider.focus();
    const wider = (await instructions.boundingBox())!.width;
    await page.keyboard.press('ArrowLeft');
    expect((await instructions.boundingBox())!.width).toBeLessThan(wider);
  });

  test('medium: instructions on top, editor and preview side by side', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto(STEP_1);
    const i = (await page.locator('.wk-instructions').boundingBox())!;
    const e = (await page.locator('.wk-editor').boundingBox())!;
    const o = (await page.locator('.wk-output-pane').boundingBox())!;
    expect(i.y + i.height).toBeLessThanOrEqual(e.y + 1);
    expect(e.y).toBeCloseTo(o.y, 0);
    expect(e.x + e.width).toBeLessThanOrEqual(o.x + 1);
    await expect(page.getByRole('separator')).toHaveCount(0);
  });

  test.describe('phone', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('three tabs; the slip stays visible from the Code tab', async ({ page }) => {
      await page.goto(STEP_1);
      const tabs = page.getByRole('tablist', { name: 'Panels' });
      await expect(tabs.getByRole('tab')).toHaveText(['Instructions', 'Code', 'Preview']);
      await expect(page.getByText('Every page starts with some content')).toBeVisible();
      await expect(page.locator('.cm-content')).toBeHidden();

      await tabs.getByRole('tab', { name: 'Code' }).click();
      await expect(page.locator('.cm-content')).toBeVisible();
      await expect(page.getByText('Every page starts with some content')).toBeHidden();
      await check(page).click();
      await expect(slip(page)).toContainText('Your page should have exactly one');

      await tabs.getByRole('tab', { name: 'Preview' }).click();
      await expect(page.locator('iframe[title="Preview of your page"]')).toBeVisible();

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      // The Check button is a comfortable touch target.
      expect((await check(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    });
  });
});
