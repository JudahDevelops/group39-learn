# --description--

Build a recipe page for jollof rice, like the example. Use the user stories as your checklist: when every test passes, the lab is done. You choose the words for the introduction, the ingredients and the steps. The picture is already in the course at `/img/jollof-rice.svg`.

# --user-stories--

1. Your page has a `<!DOCTYPE html>` declaration.
2. Your page has an `html` element with the `lang` attribute set to `en`.
3. Your `html` element has a `head` element. It holds a `meta` element with `charset` set to `UTF-8`, and a `title` element with the name of your recipe.
4. Your `html` element has a `body` element.
5. Your page has exactly one `h1` element with the name of your recipe. The name includes the word `Jollof`.
6. Your page has a `p` element below the `h1` element that introduces the recipe.
7. Your page has one `img` element. Its `src` is `/img/jollof-rice.svg` and its `alt` describes the picture.
8. Your page has an `h2` element with the text `Ingredients`.
9. Below that `h2` element, your page has a `ul` element with at least four `li` elements that list the ingredients.
10. Your page has a second `h2` element with the text `Instructions`.
11. Below that `h2` element, your page has an `ol` element with at least four `li` elements that list the steps in order.

# --hints--

Your recipe page should have the doctype `<!DOCTYPE html>`.

```js
assert.match(code, /<!DOCTYPE html>/i);
```

Your page should have an `html` element with the attribute `lang="en"`.

```js
assert.match(code, /<html\s[^>]*lang\s*=\s*("|')en\1[^>]*>/i);
```

Your `html` element needs a closing tag. Closing tags have a `/` just after the `<`.

```js
assert.match(code, /<\/html\s*>/i);
```

Your `html` element should have a `head` element with an opening tag and a closing tag.

```js
assert.match(code, /<head[\s>][\s\S]*<\/head\s*>/i);
```

Your `head` element should have a `meta` element with the attribute `charset="UTF-8"`.

```js
const meta = document.querySelector('head > meta[charset]');
assert.exists(meta);
assert.equal(meta.getAttribute('charset').toUpperCase(), 'UTF-8');
```

Your `head` element should have a `title` element with the name of your recipe, and the `title` needs a closing tag.

```js
assert.match(code, /<\/title\s*>/i);
assert.isAbove(document.querySelector('head > title')?.textContent.trim().length, 0);
```

Your `html` element should have a `body` element with an opening tag and a closing tag.

```js
assert.match(code, /<body[\s>][\s\S]*<\/body\s*>/i);
```

Your page should have exactly one `h1` element.

```js
assert.lengthOf(document.querySelectorAll('h1'), 1);
```

Your `h1` element should have the name of your recipe, and the name should include the word `Jollof`.

```js
assert.match(document.querySelector('h1').textContent, /jollof/i);
```

Your page should have a `p` element below the `h1` element.

```js
const h1 = document.querySelector('h1');
const p = document.querySelector('p');
assert.exists(p);
assert.isTrue(Boolean(h1.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING));
```

Your first `p` element should introduce the recipe, so it needs some text.

```js
assert.isAbove(document.querySelector('p')?.textContent.trim().length, 0);
```

Your page should have exactly one `img` element.

```js
assert.lengthOf(document.querySelectorAll('img'), 1);
```

Your `img` element should have the attribute `src="/img/jollof-rice.svg"`. Check the spelling of the file name.

```js
assert.equal(document.querySelector('img')?.getAttribute('src'), '/img/jollof-rice.svg');
```

Your `img` element needs an `alt` attribute that describes the picture in words, not just the file name.

```js
const alt = document.querySelector('img')?.getAttribute('alt') ?? '';
assert.isAbove(alt.trim().length, 0);
assert.notMatch(alt, /\.svg/i);
```

Your first `h2` element should have the text `Ingredients`.

```js
assert.equal(document.querySelectorAll('h2')[0]?.textContent.trim(), 'Ingredients');
```

Your `ul` element should come directly below your first `h2` element.

```js
assert.equal(document.querySelectorAll('h2')[0]?.nextElementSibling?.tagName, 'UL');
```

Your `ul` element should have at least four `li` elements, and each one needs some text.

```js
const items = document.querySelectorAll('ul > li');
assert.isAtLeast(items.length, 4);
items.forEach((li) => assert.isAbove(li.textContent.trim().length, 0));
```

Your second `h2` element should have the text `Instructions`.

```js
assert.equal(document.querySelectorAll('h2')[1]?.textContent.trim(), 'Instructions');
```

Your `ol` element should come directly below your second `h2` element.

```js
assert.equal(document.querySelectorAll('h2')[1]?.nextElementSibling?.tagName, 'OL');
```

Your `ol` element should have at least four `li` elements, and each one needs some text.

```js
const items = document.querySelectorAll('ol > li');
assert.isAtLeast(items.length, 4);
items.forEach((li) => assert.isAbove(li.textContent.trim().length, 0));
```

Every `li` element needs a closing tag, `</li>`, and every list needs its own closing tag.

```js
const opened = (code.match(/<li[\s>]/gi) ?? []).length;
const closed = (code.match(/<\/li\s*>/gi) ?? []).length;
assert.equal(opened, closed);
assert.match(code, /<\/ul\s*>/i);
assert.match(code, /<\/ol\s*>/i);
```

# --seed--

## --seed-contents--

```html file=index.html

```

# --solutions--

```html file=index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Jollof Rice</title>
  </head>
  <body>
    <h1>Jollof Rice</h1>
    <p>Jollof rice is a one-pot rice dish cooked in a rich tomato and pepper sauce. This recipe feeds four people and takes about an hour.</p>
    <img src="/img/jollof-rice.svg" alt="A bowl of jollof rice with plantain slices and a green garnish">
    <h2>Ingredients</h2>
    <ul>
      <li>2 cups parboiled rice</li>
      <li>4 fresh tomatoes</li>
      <li>3 red bell peppers (tatashe)</li>
      <li>2 scotch bonnet peppers (ata rodo)</li>
      <li>1 large onion</li>
      <li>1/3 cup vegetable oil</li>
      <li>2 tablespoons tomato paste</li>
      <li>2 cups chicken stock</li>
      <li>1 teaspoon thyme</li>
      <li>Salt to taste</li>
    </ul>
    <h2>Instructions</h2>
    <ol>
      <li>Blend the tomatoes, bell peppers, scotch bonnet peppers and half of the onion until smooth.</li>
      <li>Boil the blended mixture in a pot until most of the water has dried out.</li>
      <li>Heat the oil in a second pot. Fry the rest of the onion, sliced, for two minutes, then add the tomato paste and fry for five minutes.</li>
      <li>Add the boiled mixture, the thyme and the salt. Fry for ten minutes, stirring often.</li>
      <li>Pour in the stock and bring it to a boil.</li>
      <li>Add the washed rice, cover the pot, and cook on low heat for 30 minutes, until the rice is soft.</li>
    </ol>
  </body>
</html>
```

# --help--

## --hint--

Build the page from the outside in. First write the parts every page has, then fill the `body` one user story at a time and check after each one.

## --hint--

A list needs two kinds of element: one that wraps the whole list, and one for each item inside it. A bulleted list and a numbered list use different wrappers.

## --hint--

When a test about a picture fails, read the user story again. One attribute says which file to show and another describes it for someone who cannot see it.
