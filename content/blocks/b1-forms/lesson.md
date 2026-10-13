# --screen-- concept

A form collects what a visitor types. `<form>` wraps the fields and the submit button. A field marked `required` must be filled in before the browser lets the form go.

::: tryit web
```html file=index.html
<form id="complaint-form">
  <label for="description">What's wrong?</label>
  <textarea id="description" name="description" rows="4" required></textarea>
  <button type="submit">Submit complaint</button>
</form>
```
:::

## --callout-- info

This form does not send anything yet. A later part of the course uses JavaScript to catch the submit and send the data to the server.

# --screen-- concept

Every field needs a `<label>`. The label's `for` is the same as the field's `id`. Click the label and the cursor jumps into the field. Screen readers read the label out.

::: tryit web
```html file=index.html
<label for="room">Room</label>
<input type="text" id="room" name="room">
```
:::

## --callout-- tip

Click the word Room in the preview. The cursor lands in the field.

# --screen-- mcq

## --question--

Why does every field need a `<label>`?

## --options--

- [x] So users and screen readers know what the field is for
  > Yes. The label names the field for people who see it and for people who hear it.
- [ ] So the form can be submitted
  > No. A form submits without labels. Labels are there for people, not for sending.
- [ ] To make the text bold
  > No. How text looks, such as bold, is CSS. A label's job is to name the field.

## --why--

A label says what a field is for. It also makes the field easier to reach, because clicking the label focuses it.

# --screen-- spotbug

## --code--

```html file=index.html
<label for="email">Email</label>
<input type="email" id="user-email" name="email">
```

## --question--

Clicking the label does not move the cursor into the field. What is wrong?

## --options--

- [x] The label's `for` is `email`, but the field's `id` is `user-email`.
  > Yes. The two must be exactly the same, or the label is not tied to the field.
- [ ] The `input` needs a closing tag, `</input>`.
  > No. An `input` has no closing tag.
- [ ] The label must sit inside the `input`.
  > No. The label is a separate element. It finds its field by matching `for` to `id`.
- [ ] The `type` should be `text`.
  > No. `email` is a valid type, and the type has nothing to do with the label.

## --why--

A label finds its field by matching `for` to `id`. Check that both are spelled the same.

# --screen-- concept

`<input type="...">` makes a one-line field. The `type` can be `text`, `email`, `password` or `number`. A `password` field hides what you type. `<textarea>` takes several lines.

::: tryit web
```html file=index.html
<label for="room">Room</label>
<input type="text" id="room" name="room">
<label for="pass">Password</label>
<input type="password" id="pass" name="pass">
<label for="note">Note</label>
<textarea id="note" name="note" rows="3"></textarea>
```
:::

# --screen-- mcq

## --question--

Which input type hides what you type?

## --options--

- [ ] `text`
  > No. A `text` field shows every letter as you type it.
- [x] `password`
  > Yes. A `password` field shows dots instead of the letters.
- [ ] `hidden`
  > No. A `hidden` input is not shown on the page at all, so there is nothing to type into.

## --why--

Use `type="password"` for any field where the letters should not be seen over someone's shoulder.

# --screen-- tapbuild

## --prompt--

Finish the complaint form. The browser must refuse to submit it until the description is filled in.

## --template--

```html
<form id="complaint-form">
  <label for="description">What's wrong?</label>
  <textarea id="description" name="description" rows="4" ___></textarea>
  <button type="___">Submit complaint</button>
</form>
```

## --tokens--

- `required`
- `submit`
- `require`
- `needed`
- `send`
- `button`

## --answer--

- `required`
- `submit`

## --why--

The attribute is spelled `required`. A button that sends the form has `type="submit"`. `send` is not a button type, so the browser would ignore it.

# --screen-- predict

## --code--

```html file=index.html
<form>
  <label for="room">Room</label>
  <input type="text" id="room" name="room" required>
  <button type="submit">Report</button>
</form>
```

## --question--

A student presses Report with the Room field empty. What happens?

## --options--

- [x] The browser stops and asks them to fill in the field.
  > Yes. `required` makes the browser check the field before it submits.
- [ ] The form is sent with an empty room.
  > No. That would happen without `required`. With it, the browser blocks an empty field.
- [ ] The room is filled in automatically.
  > No. The browser never invents a value. It asks the visitor for one.
- [ ] Nothing happens, because the page has no JavaScript.
  > No. The check for `required` is built into the browser and needs no JavaScript.

## --why--

The browser checks `required` fields before it submits the form. Later, JavaScript will take over what happens after that.

# --screen-- concept

A drop-down is a `<select>` with one `<option>` for each choice. The visitor reads the text of an option. The page gets its `value`.

::: tryit web
```html file=index.html
<label for="status-filter">Show</label>
<select id="status-filter">
  <option value="all">All complaints</option>
  <option value="Open">Open</option>
  <option value="Assigned">Assigned</option>
  <option value="In Progress">In Progress</option>
  <option value="Resolved">Resolved</option>
</select>
```
:::

## --callout-- info

This is the status filter for the Staff Dashboard.

# --screen-- mcq

## --question--

In `<option value="all">All complaints</option>`, which words does the visitor read?

## --options--

- [x] All complaints
  > Yes. The text between the tags is what shows in the drop-down.
- [ ] all
  > No. That is the `value`. The page uses it behind the scenes, and the visitor does not see it.
- [ ] option
  > No. An element's name is never shown on the page.

## --why--

The text is for the visitor. The `value` is for the page.

# --screen-- match

## --prompt--

Match each form element to its job.

## --pairs--

- `<form>`
  - Wraps the fields and the submit button
- `<input type="email">`
  - A one-line field for an email address
- `<textarea>`
  - A field for several lines of text
- `<select>`
  - A drop-down list
- `<button type="submit">`
  - Sends the form

## --why--

Each element has one job. A form is made by putting the right ones together inside a `form` element.

# --screen-- multi

## --question--

Select every element that needs a `<label>`.

## --options--

- [x] `<input type="email">`
  > Yes. It is a field, and visitors need to know what to type in it.
- [x] `<textarea>`
  > Yes. A field for several lines needs a label too.
- [x] `<select>`
  > Yes. A drop-down is a field too. Without a label, nobody knows what it chooses.
- [ ] `<button type="submit">`
  > No. A button shows its own words, such as "Log in", so it is not a field that needs a label.

## --why--

Every field needs a label: inputs, text areas and drop-downs. A button already has words on it.

# --screen-- typein

## --prompt--

Build `login.html`. Inside the `body`, add a `form` with an email field, a password field and a button with the text `Log in`. Give every field a `label` whose `for` matches the field's `id`.

## --seed-contents--

```html file=login.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Log in</title>
  </head>
  <body>
--editable-region--

--editable-region--
  </body>
</html>
```

## --tests--

Your page should have a `form` element.

```js
assert.exists(document.querySelector('form'));
```

Your `form` should have an `input` element for the email, with `type="email"`.

```js
assert.exists(document.querySelector('form input[type="email"]'));
```

Your `form` should have an `input` element for the password, with `type="password"`. This type hides what the visitor types.

```js
assert.exists(document.querySelector('form input[type="password"]'));
```

Your `form` should have a `button` element with the text `Log in`.

```js
assert.equal(document.querySelector('form button')?.textContent.trim(), 'Log in');
```

Every field needs an `id` attribute, so that a label can point to it.

```js
const fields = document.querySelectorAll('form input, form textarea, form select');
assert.isAbove(fields.length, 0);
fields.forEach((f) => assert.isAbove(f.id.length, 0));
```

Every field needs a `label` whose `for` is the same as the field's `id`. Check the spelling of both.

```js
const labels = [...document.querySelectorAll('label')];
document.querySelectorAll('form input, form textarea, form select').forEach((f) => {
  assert.isTrue(labels.some((l) => l.getAttribute('for') === f.id));
});
```

Each `label` needs some text for visitors to read between its tags.

```js
const labels = document.querySelectorAll('label');
assert.isAbove(labels.length, 0);
labels.forEach((l) => assert.isAbove(l.textContent.trim().length, 0));
```

## --solutions--

```html file=login.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Log in</title>
  </head>
  <body>
    <form>
      <label for="email">Email</label>
      <input type="email" id="email" name="email">
      <label for="password">Password</label>
      <input type="password" id="password" name="password">
      <button type="submit">Log in</button>
    </form>
  </body>
</html>
```

## --why--

A login form is a `form` holding two fields and a button. Each field has an `id` that its `label` names in `for`, and the password field uses `type="password"` so the letters are hidden.
