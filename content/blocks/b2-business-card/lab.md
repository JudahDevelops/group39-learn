# --description--

Build a business card for a student, like the example. Use the user stories as your checklist: when every test passes, the lab is done. You choose the name, the course and the contact details. The card should look good on a laptop and on a phone.

# --user-stories--

1. Your `card.html` has a `link` element in the `head` that connects `styles.css`.
2. Your `body` has one `div` element with the class `card`. It holds everything on the card.
3. Your card has an `h1` element with the student's name, and a `p` element with the class `course` that gives the course and level.
4. Your card has a `div` element with the class `contact`. It holds two `p` elements: an email address and a phone number.
5. Every element counts its padding and border in its width, with `box-sizing` set to `border-box`.
6. Your `.card` has a `max-width` of `24rem`, and it is centred on the page with equal left and right margins.
7. Your `.card` has a `padding` of at least `1rem` on all four sides.
8. Your `.card` has a `solid` border that is at least `1px` wide.
9. Your `.card` has a `border-radius` of at least `8px`.
10. Your `.contact` is a flex row. Its `justify-content` is `space-between` and its `gap` is at least `1rem`, so the email sits on the left and the phone number on the right.
11. On a screen 600px wide or less, your `.contact` stacks its items in a column.

# --hints--

Your `head` element should have a `link` element.

```js
assert.match(code, /<head[\s>][\s\S]*<link[\s>][\s\S]*<\/head\s*>/i);
```

Your `link` element should have the attributes `rel="stylesheet"` and `href="styles.css"`. Check the spelling of both values.

```js
assert.match(code, /<link\s[^>]*rel\s*=\s*("|')stylesheet\1[^>]*>/i);
assert.match(code, /<link\s[^>]*href\s*=\s*("|')(?:\.\/)?styles\.css\1[^>]*>/i);
```

Your `body` element should have exactly one `div` element with the class `card`.

```js
assert.lengthOf(document.querySelectorAll('body > div.card'), 1);
```

Your `.card` should have an `h1` element with the student's name, and it should be the only `h1` on the page.

```js
assert.lengthOf(document.querySelectorAll('h1'), 1);
assert.isAbove(document.querySelector('.card h1')?.textContent.trim().length ?? 0, 0);
```

Your `.card` should have a `p` element with the class `course`, and it needs some text.

```js
assert.isAbove(document.querySelector('.card p.course')?.textContent.trim().length ?? 0, 0);
```

Your `.card` should have a `div` element with the class `contact`.

```js
assert.exists(document.querySelector('.card div.contact'));
```

Your `.contact` should have exactly two `p` elements, and each one needs some text.

```js
const items = document.querySelectorAll('.contact > p');
assert.lengthOf(items, 2);
items.forEach((p) => assert.isAbove(p.textContent.trim().length, 0));
```

Every element on your page should have a `box-sizing` of `border-box`. Use a rule with the `*` selector.

```js
[document.body, ...document.body.querySelectorAll('*')].forEach((el) => assert.equal(getComputedStyle(el).boxSizing, 'border-box'));
```

Your `.card` should have a `max-width` of `24rem`.

```js
assert.equal(getComputedStyle(document.querySelector('.card')).maxWidth, '384px');
```

Your `.card` should be centred. Its left and right margins should be equal, and bigger than zero on a wide screen.

```js
const cs = getComputedStyle(document.querySelector('.card'));
assert.isAbove(parseFloat(cs.marginLeft), 0);
assert.equal(cs.marginLeft, cs.marginRight);
```

Your `.card` should have a `padding` of at least `1rem` on all four sides.

```js
const cs = getComputedStyle(document.querySelector('.card'));
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.isAtLeast(parseFloat(cs['padding' + side]), 16));
```

Your `.card` should have a border with the style `solid`, on all four sides.

```js
const cs = getComputedStyle(document.querySelector('.card'));
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.equal(cs['border' + side + 'Style'], 'solid'));
```

Your `.card` border should be at least `1px` wide.

```js
const cs = getComputedStyle(document.querySelector('.card'));
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.isAtLeast(parseFloat(cs['border' + side + 'Width']), 1));
```

Your `.card` should have a `border-radius` of at least `8px` on all four corners.

```js
const cs = getComputedStyle(document.querySelector('.card'));
['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].forEach((corner) => assert.isAtLeast(parseFloat(cs['border' + corner + 'Radius']), 8));
```

Your `.contact` should have a `display` of `flex`.

```js
assert.equal(getComputedStyle(document.querySelector('.contact')).display, 'flex');
```

Your `.contact` should have a `justify-content` of `space-between`.

```js
assert.equal(getComputedStyle(document.querySelector('.contact')).justifyContent, 'space-between');
```

Your `.contact` should have a `gap` of at least `1rem`.

```js
assert.isAtLeast(parseFloat(getComputedStyle(document.querySelector('.contact')).columnGap), 16);
```

On a wide screen, the email and the phone number should sit side by side in a row, with the email on the left.

```js
const [first, second] = [...document.querySelectorAll('.contact > p')].map((p) => p.getBoundingClientRect());
assert.equal(Math.round(first.top), Math.round(second.top));
assert.isAbove(second.left, first.right);
```

Your `styles.css` should have a media query that starts with `@media (max-width: 600px)`.

```js
const media = [...document.styleSheets].flatMap((s) => [...s.cssRules]).filter((r) => r instanceof CSSMediaRule);
assert.isTrue(media.some((r) => /max-width:\s*600px/.test(r.media.mediaText)));
```

Your media query should have a `.contact` rule that sets `flex-direction` to `column`.

```js
const media = [...document.styleSheets].flatMap((s) => [...s.cssRules]).filter((r) => r instanceof CSSMediaRule && /max-width:\s*600px/.test(r.media.mediaText));
const rule = media.flatMap((r) => [...r.cssRules]).find((c) => c.selectorText === '.contact');
assert.exists(rule);
assert.equal(rule.style.flexDirection, 'column');
```

Your `.contact` should still be a row on a wide screen. Check that the `flex-direction: column` rule is inside the media query, not outside it.

```js
assert.equal(getComputedStyle(document.querySelector('.contact')).flexDirection, 'row');
```

# --seed--

## --seed-contents--

```html file=card.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Business Card</title>
  </head>
  <body>
  </body>
</html>
```

```css file=styles.css

```

# --solutions--

```html file=card.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Business Card</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <div class="card">
      <h1>Amina Bello</h1>
      <p class="course">300 level Computer Science</p>
      <div class="contact">
        <p>amina.bello@example.com</p>
        <p>0800 000 0000</p>
      </div>
    </div>
  </body>
</html>
```

```css file=styles.css
* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  color: #1a1a1a;
  background-color: #f4f6f8;
}

.card {
  max-width: 24rem;
  margin: 3rem auto;
  padding: 1.5rem;
  background-color: white;
  border: 1px solid #dce8f5;
  border-radius: 12px;
}

h1 {
  margin: 0;
  color: #1f5c99;
  font-size: 1.75rem;
}

.course {
  margin: 0.25rem 0;
  color: #5b6b80;
}

.contact {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dce8f5;
}

.contact p {
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .contact {
    flex-direction: column;
  }
}
```

# --help--

## --hint--

Build from the outside in. First write the elements and connect the stylesheet, then give the card its box, then lay out the contact row. Check after each user story.

## --hint--

Every story about size and space names one layer of the box model. Padding is inside the border and margin is outside it. `box-sizing` changes what `width` counts, and `max-width` stops a box growing too wide.

## --hint--

A flex row needs a parent that is told to be a flex container, and properties that say how its children share the row. A media query wraps an ordinary rule so that it runs only on narrow screens.
