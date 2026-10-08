# --description--

Build a notice page for the bursary, like the example. Use the user stories as your checklist. You choose the words.

# --user-stories--

1. Your page has one `h1` element with a heading of your choice.
2. Your page has at least two `p` elements with text in them.
3. Your page has a `ul` element with at least three `li` elements.
4. Your page has a `button` element.

# --hints--

Your page should have exactly one `h1` element.

```js
assert.lengthOf(document.querySelectorAll('h1'), 1);
```

Your `h1` element should not be empty.

```js
assert.isAbove(document.querySelector('h1').textContent.trim().length, 0);
```

Your page should have at least two `p` elements.

```js
assert.isAtLeast(document.querySelectorAll('p').length, 2);
```

Every `p` element should have some text.

```js
document.querySelectorAll('p').forEach((p) => assert.isAbove(p.textContent.trim().length, 0));
```

Your page should have a `ul` element.

```js
assert.exists(document.querySelector('ul'));
```

Your `ul` element should have at least three `li` elements.

```js
assert.isAtLeast(document.querySelectorAll('ul li').length, 3);
```

Your page should have a `button` element.

```js
assert.exists(document.querySelector('button'));
```

# --seed--

## --seed-contents--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Bursary Notice</title>
  </head>
  <body>
  </body>
</html>
```

# --solutions--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Bursary Notice</title>
  </head>
  <body>
    <h1>Bursary Notice</h1>
    <p>Second semester fees are now open for payment.</p>
    <p>Bring your receipt to the bursary office to collect your clearance slip.</p>
    <ul>
      <li>Pay at an approved bank.</li>
      <li>Keep the receipt.</li>
      <li>Visit the bursary before 4 pm.</li>
    </ul>
    <button>I have paid</button>
  </body>
</html>
```

# --help--

## --hint--

Each user story names one element. Start with the one you know best and add the others one at a time.

## --hint--

A list needs two kinds of element: one that wraps the whole list, and one for each item inside it.
