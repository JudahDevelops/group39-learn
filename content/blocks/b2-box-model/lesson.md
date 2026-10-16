# --screen-- concept

Every element is a box with four layers. From the inside out they are the **content**, the **padding**, the **border** and the **margin**. A `div` is a plain box with no meaning of its own, so it suits things you want to style together. Change a number in `styles.css` and press Run.

::: tryit web
```html file=index.html
<div class="card">
  <p>Room B-214, plumbing, open.</p>
</div>
```

```css file=styles.css
.card {
  background-color: #dce8f5;
  border: 4px solid #1f5c99;
  padding: 1rem;
  margin: 1.5rem;
}
```
:::

## --callout-- info

The `link` line is left out of the examples from here on. The preview adds `styles.css` for you.

# --screen-- match

## --prompt--

Match each layer of the box to what it is.

## --pairs--

- Content
  - The text or picture itself
- Padding
  - Space inside the border, around the content
- Border
  - The line around the padding
- Margin
  - Space outside the border, between this box and the next

## --why--

A box has four layers. Padding is inside the border and margin is outside it.

# --screen-- order

## --prompt--

Put the layers in order, from the outside of the box to the inside.

## --items--

- The margin
- The border
- The padding
- The content

## --why--

The margin is outermost, then the border, then the padding. The content sits in the middle.

# --screen-- mcq

## --question--

Which layer is the space inside the border?

## --options--

- [x] Padding
  > Yes. Padding is the space between the content and the border.
- [ ] Margin
  > No. Margin is the space outside the border.
- [ ] Border
  > No. The border is the line itself. It has a width, but it is not space.
- [ ] Content
  > No. The content is the text or picture inside the box.

## --why--

Padding is inside the border. Margin is outside it.

# --screen-- concept

`padding` and `margin` take one value for all four sides, or two values. The first is for the top and bottom, and the second is for the left and right. So `padding: 0.5rem 2rem` is 0.5rem above and below, and 2rem on each side.

::: tryit web
```html file=index.html
<div class="card">B-214 · Plumbing · Open</div>
<div class="card">A-110 · Carpentry · Resolved</div>
```

```css file=styles.css
.card {
  padding: 0.5rem 2rem;
  margin: 1rem 0;
  border: 2px solid #1f5c99;
}
```
:::

## --callout-- tip

Change `margin: 1rem 0` to `margin: 0 3rem` and press Run.

# --screen-- predict

## --code--

```css file=styles.css
.card {
  margin: 1rem 0;
}
```

## --question--

How much margin does the card have on its left side?

## --options--

- [x] None, because the second value is `0`
  > Yes. The first value, `1rem`, is for the top and bottom. The second, `0`, is for the left and right.
- [ ] `1rem`
  > No. `1rem` is the first value, which is for the top and bottom only.
- [ ] `2rem`
  > No. The two values are not added together. Each one has its own sides.
- [ ] `auto`
  > No. Nothing in the rule says `auto`.

## --why--

With two values, the first is for the top and bottom, and the second is for the left and right.

# --screen-- concept

`border` takes three values: the width, the style and the colour. `border-radius` rounds the corners, and a bigger number is rounder. `background-color` fills the content and the padding.

::: tryit web
```html file=index.html
<div class="card">
  <p>Room B-214, plumbing, open.</p>
</div>
```

```css file=styles.css
.card {
  background-color: #dce8f5;
  border: 2px solid #1f5c99;
  border-radius: 8px;
  padding: 1rem;
}
```
:::

## --callout-- tip

Change `8px` to `30px` and press Run.

# --screen-- tapbuild

## --prompt--

Give the card space inside its border, and rounded corners.

## --template--

```css
.card {
  ___: 1rem;
  ___: 8px;
}
```

## --tokens--

- `padding`
- `margin`
- `border-radius`
- `border-round`
- `radius`
- `border`

## --answer--

- `padding`
- `border-radius`

## --why--

`padding` is the space inside the border, and `margin` is the space outside it. `border-radius` rounds the corners. `border-round` and `radius` are not CSS properties, and `border: 8px` would set a border width, not a radius.

# --screen-- concept

By default, `width` counts only the content. Padding and border are added on top, so a 300px box ends up wider than 300px. `box-sizing: border-box` makes `width` include them. The `*` selector matches every element, so one rule fixes the whole page.

## --code--

```css file=styles.css
* {
  box-sizing: border-box;
}
```

## --callout-- tip

Put this rule at the top of every stylesheet. The sums become easy.

# --screen-- predict

## --code--

```css file=styles.css
* {
  box-sizing: border-box;
}

.card {
  width: 300px;
  padding: 20px;
  border: 5px solid #1f5c99;
}
```

## --question--

How wide is the card on the page, from the outer edge of one border to the outer edge of the other?

## --options--

- [x] 300px
  > Yes. With `border-box`, the `width` already includes the padding and the border.
- [ ] 350px
  > No. That is the width without `border-box`: 300 plus 40 of padding plus 10 of border.
- [ ] 340px
  > No. That adds only the padding to the width. With `border-box`, nothing is added.
- [ ] 310px
  > No. That adds only the border to the width. With `border-box`, nothing is added.

## --why--

`box-sizing: border-box` makes `width` the size of the whole box up to the outer edge of the border.

# --screen-- mcq

## --question--

What does `box-sizing: border-box` change?

## --options--

- [x] The width includes the padding and the border.
  > Yes. A box with `width: 300px` is 300px wide, border to border.
- [ ] Boxes get rounded corners.
  > No. Rounded corners come from `border-radius`.
- [ ] The width includes the margin too.
  > No. The margin stays outside the width, however `box-sizing` is set.
- [ ] The border becomes thicker.
  > No. The thickness of the border is set by `border`, not `box-sizing`.

## --why--

`border-box` changes how `width` is counted, not how the box looks.

# --screen-- concept

`max-width` stops a box growing wider than is comfortable to read, but still lets it shrink on a phone. `margin: 1rem auto` keeps `1rem` above and below and shares the spare space equally on the left and right, which centres the box.

::: tryit web
```html file=index.html
<div class="card">
  <p>Room B-214, plumbing, open.</p>
</div>
```

```css file=styles.css
.card {
  max-width: 20rem;
  margin: 1rem auto;
  padding: 1rem;
  border: 2px solid #1f5c99;
  border-radius: 8px;
}
```
:::

## --callout-- tip

Change `auto` to `0` and press Run. The card moves to the left.

# --screen-- spotbug

## --code--

```css file=styles.css
.card {
  border: 1px solid #dce8f5;
  margin: 1rem;
}
```

## --question--

The text inside the card touches its border. What is wrong?

## --options--

- [x] The rule uses `margin`, which is outside the border. It needs `padding`.
  > Yes. Space between the content and the border is padding.
- [ ] The border is too thin.
  > No. The width of the border does not change the gap between the text and the border.
- [ ] The card needs `border-radius`.
  > No. Rounded corners change the shape of the card, not the space inside it.
- [ ] `1rem` is not a valid unit.
  > No. `rem` is a valid unit. The property is the problem, not the unit.

## --why--

Padding makes space inside the border and margin makes space outside it. Choose the one that matches where you want the gap.

# --screen-- typein

## --prompt--

Style the complaint form. It is already inside a `div` with the class `card`. In `styles.css`:

- Make `.card` a bordered card: a `1px solid` border, `padding` of `1rem`, a `border-radius` of `8px` and a `max-width` of `40rem`.
- Make every element count its padding and border in its width.
- Give the `input` and `textarea` fields a `width` of `100%` and a `margin` of `0.5rem 0`.

## --seed-contents--

```html file=student.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Student Portal</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <div class="card">
      <h2>Report a fault</h2>
      <form id="complaint-form">
        <label for="room">Room</label>
        <input type="text" id="room" name="room" required>
        <label for="description">What's wrong?</label>
        <textarea id="description" name="description" rows="4" required></textarea>
        <button type="submit">Submit complaint</button>
      </form>
    </div>
  </body>
</html>
```

```css file=styles.css
--editable-region--

--editable-region--
```

## --tests--

Your `styles.css` should have a rule for `.card`. The class selector starts with a dot.

```js
assert.match(files['styles.css'], /\.card\s*\{/);
```

Your `.card` should have a border that is `1px` wide and `solid`.

```js
const cs = getComputedStyle(document.querySelector('.card'));
assert.equal(cs.borderTopWidth, '1px');
assert.equal(cs.borderTopStyle, 'solid');
```

Your `.card` should have a `padding` of `1rem` on all four sides.

```js
const cs = getComputedStyle(document.querySelector('.card'));
['Top', 'Right', 'Bottom', 'Left'].forEach((side) => assert.equal(cs['padding' + side], '16px'));
```

Your `.card` should have a `border-radius` of `8px`.

```js
assert.equal(getComputedStyle(document.querySelector('.card')).borderTopLeftRadius, '8px');
```

Your `.card` should have a `max-width` of `40rem`.

```js
assert.equal(getComputedStyle(document.querySelector('.card')).maxWidth, '640px');
```

Your `input`, `textarea` and `.card` should all have a `box-sizing` of `border-box`. Use the `*` selector.

```js
['.card', 'input', 'textarea'].forEach((sel) => assert.equal(getComputedStyle(document.querySelector(sel)).boxSizing, 'border-box'));
```

Your `textarea` should fill the width inside the card. Give it a `width` of `100%`.

```js
const card = document.querySelector('.card');
const cs = getComputedStyle(card);
const inner = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
assert.approximately(document.querySelector('textarea').getBoundingClientRect().width, inner, 1);
```

Your `input` should fill the width inside the card. Give it a `width` of `100%`.

```js
const card = document.querySelector('.card');
const cs = getComputedStyle(card);
const inner = card.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
assert.approximately(document.querySelector('input').getBoundingClientRect().width, inner, 1);
```

Your `input` and `textarea` fields should have `0.5rem` of space above and below. Set `margin` to `0.5rem 0`.

```js
['input', 'textarea'].forEach((sel) => {
  const cs = getComputedStyle(document.querySelector(sel));
  assert.equal(cs.marginTop, '8px');
  assert.equal(cs.marginBottom, '8px');
});
```

## --solutions--

```html file=student.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Student Portal</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <div class="card">
      <h2>Report a fault</h2>
      <form id="complaint-form">
        <label for="room">Room</label>
        <input type="text" id="room" name="room" required>
        <label for="description">What's wrong?</label>
        <textarea id="description" name="description" rows="4" required></textarea>
        <button type="submit">Submit complaint</button>
      </form>
    </div>
  </body>
</html>
```

```css file=styles.css
* {
  box-sizing: border-box;
}

.card {
  max-width: 40rem;
  padding: 1rem;
  border: 1px solid #dce8f5;
  border-radius: 8px;
}

input,
textarea {
  width: 100%;
  margin: 0.5rem 0;
}
```

## --why--

The card is padding, a border and rounded corners around the form, held to a `max-width`. `border-box` stops the 100% wide fields from poking out of it, and the margin keeps them apart.
