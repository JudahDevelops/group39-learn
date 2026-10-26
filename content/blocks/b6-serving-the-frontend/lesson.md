# --screen-- concept

Let FastAPI serve your `frontend` folder too. Then the pages and the API come from the same address, and the browser lets them talk freely. This is the laptop version: `frontend` sits one folder up from `backend`.

## --code--

```python file=main.py
# at the BOTTOM of main.py, after every /api route
from pathlib import Path
from fastapi.staticfiles import StaticFiles

FRONTEND = Path(__file__).parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")
```

## --callout-- info

`Path(__file__).parent` is `backend`. A second `.parent` is the project folder. `html=True` makes `/` show `index.html`.

# --screen-- concept

In this project the folders sit side by side, so the path has one `.parent`. Press Run, then send `GET /`, `GET /student.html` and `GET /api/health`. The panel shows a page as text. It does not draw the page or run its JavaScript, so the form only works on your laptop.

::: tryit fastapi
```python file=main.py
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="IHMS")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# The mount goes last. It answers every path the routes above did not.
FRONTEND = Path(__file__).parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")
```

```html file=frontend/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
    <a href="student.html">Student Portal</a>
  </body>
</html>
```

```html file=frontend/student.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Student Portal</title>
    <script src="js/student.js" defer></script>
  </head>
  <body>
    <h1>Student Portal</h1>
    <form id="complaint-form">
      <label for="description">What's wrong?</label>
      <textarea id="description" rows="4" required></textarea>
      <button type="submit">Submit complaint</button>
    </form>
    <p id="message"></p>
  </body>
</html>
```

```js file=frontend/js/student.js
const form = document.querySelector("#complaint-form");
const message = document.querySelector("#message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const description = document.querySelector("#description").value;

  const response = await fetch("/api/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    message.textContent = "Please describe the problem in at least 10 characters.";
    return;
  }
  const complaint = await response.json();
  const due = new Date(complaint.deadline).toLocaleString("en-NG");
  message.textContent = `Received. ${complaint.urgency} ${complaint.category} complaint. Deadline: ${due}.`;
  form.reset();
});
```
:::

# --screen-- mcq

## --question--

Why mount the frontend after all the `/api` routes?

## --options--

- [x] The mount answers every path the routes above it did not
  > Yes. FastAPI tries the routes in order. The mount at `/` matches everything, so it must be the last one to be tried.
- [ ] Files must load last
  > No. The order of the code has nothing to do with when files load in the browser.
- [ ] The mount only works at the end of a file
  > No. It would work anywhere, but placed early it would catch the requests meant for the API.
- [ ] Routes cannot be added after a mount
  > No. You can add them, but a route after the mount is never reached.

## --why--

The mount at `/` answers every path. Put it last, so the `/api` routes get their requests first.

# --screen-- predict

## --code--

```python file=main.py
app = FastAPI(title="IHMS")

FRONTEND = Path(__file__).parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

## --question--

The mount comes before the health route. What does `GET /api/health` send back?

## --options--

- [x] A 404
  > Yes. The mount at `/` answers first. It looks for a file called `api/health` in `frontend`, finds none, and replies 404.
- [ ] `{"status": "ok"}`
  > No. That would need the route to be tried first. It comes after the mount.
- [ ] The contents of `index.html`
  > No. `index.html` is only shown for `/`. This path asks for a file that does not exist.
- [ ] A 422
  > No. A 422 means the data was wrong. Here the address was not found.

## --why--

Routes are tried in the order they were added. A mount at `/` placed first hides every route below it.

# --screen-- concept

The student page sends the complaint with `fetch`. `method: "POST"` creates something. The `Content-Type` header says the body is JSON. `JSON.stringify` turns a JavaScript object into JSON text. `{ description }` is short for `{ description: description }`.

## --code--

```js
const response = await fetch("/api/complaints", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ description }),
});
```

# --screen-- mcq

## --question--

What does `JSON.stringify` do?

## --options--

- [x] Turns a JavaScript object into JSON text
  > Yes. A request body is text, so the object must be turned into JSON text before it is sent.
- [ ] Reads JSON from the server
  > No. That is `response.json()`. `JSON.stringify` works in the other direction.
- [ ] Checks that the JSON is valid
  > No. It does not check anything. It writes out whatever object it is given.
- [ ] Sends the request
  > No. `fetch` sends the request. `JSON.stringify` only prepares the body.

## --why--

`JSON.stringify` writes a value out as JSON text. `response.json()` reads JSON text back into a value.

# --screen-- tapbuild

## --prompt--

Build the options for `fetch` that lodge a complaint.

## --template--

```js
const response = await fetch("/api/complaints", {
  method: "___",
  headers: { "Content-Type": "___" },
  body: JSON.___({ description }),
});
```

## --tokens--

- `POST`
- `GET`
- `application/json`
- `text/plain`
- `stringify`
- `parse`

## --answer--

- `POST`
- `application/json`
- `stringify`

## --why--

Lodging a complaint creates something, so the method is `POST`. The body is JSON, so the header says `application/json`. `JSON.stringify` writes the object as JSON text, and `JSON.parse` would read it back.

# --screen-- spotbug

## --code--

```js
const response = await fetch("/api/complaints", {
  method: "POST",
  body: JSON.stringify({ description }),
});
```

## --question--

The server replies 422 even when the description is long enough. What is missing?

## --options--

- [x] The header `Content-Type: application/json`
  > Yes. Without it the browser labels the body as plain text, and FastAPI does not read plain text as the JSON model.
- [ ] A `method: "GET"`
  > No. A `GET` request has no body. The method is `POST`, and that is right.
- [ ] An `await` before `JSON.stringify`
  > No. `JSON.stringify` gives its answer straight away. Only slow things need `await`.
- [ ] The description has to be sent as plain text
  > No. The server expects JSON that fits `ComplaintIn`.

## --why--

The server reads a body as JSON only when the `Content-Type` header says so.

# --screen-- order

## --prompt--

Put the steps of the form's submit handler in order.

## --items--

- Stop the browser from reloading the page
- Read the description from the text box
- Send it to `POST /api/complaints` with `fetch`
- If the reply is not ok, show an error message and stop
- Read the complaint from the reply with `response.json()`
- Show the urgency, the category and the deadline

## --why--

The handler stops the reload, collects the input, asks the server, and checks the reply before it uses it.

# --screen-- match

## --prompt--

Match each line of the handler to what it does.

## --pairs--

- `event.preventDefault()`
  - Stops the page reloading when the form is submitted
- `response.ok`
  - `true` for status 200 to 299
- `await response.json()`
  - Reads the reply as a JavaScript object
- `form.reset()`
  - Clears the text box

## --why--

Each line has one job. Check `response.ok` before you read the reply, because an error reply has no complaint in it.

# --screen-- concept

The staff page loads the same list with a `GET`. Change the address from the file it read in chapter B3 to the API, and the page shows the complaints the server holds. The list lives in the server's memory, so it empties when the server restarts. The database fixes that later.

## --code--

```js
async function loadComplaints() {
  const response = await fetch("/api/complaints");
  if (!response.ok) {
    throw new Error(`Server replied ${response.status}`);
  }
  return await response.json();
}
```

# --screen-- typein

## --prompt--

Serve the `frontend` folder. At the bottom of `main.py`, set `FRONTEND` to the `frontend` folder next to `main.py`, and mount `StaticFiles` for it at `/` with `html=True`.

## --seed-contents--

```python file=main.py
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="IHMS")


@app.get("/api/health")
def health():
    return {"status": "ok"}


--editable-region--

--editable-region--
```

```html file=frontend/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
    <a href="student.html">Student Portal</a>
  </body>
</html>
```

```html file=frontend/student.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Student Portal</title>
    <script src="js/student.js" defer></script>
  </head>
  <body>
    <h1>Student Portal</h1>
    <form id="complaint-form">
      <label for="description">What's wrong?</label>
      <textarea id="description" rows="4" required></textarea>
      <button type="submit">Submit complaint</button>
    </form>
    <p id="message"></p>
  </body>
</html>
```

```js file=frontend/js/student.js
const form = document.querySelector("#complaint-form");
const message = document.querySelector("#message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const description = document.querySelector("#description").value;

  const response = await fetch("/api/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    message.textContent = "Please describe the problem in at least 10 characters.";
    return;
  }
  const complaint = await response.json();
  const due = new Date(complaint.deadline).toLocaleString("en-NG");
  message.textContent = `Received. ${complaint.urgency} ${complaint.category} complaint. Deadline: ${due}.`;
  form.reset();
});
```

## --tests--

Your app should answer `GET /` with status 200. Mount `StaticFiles` at the path `/`.

```py
r = await client.get('/')
assert r.status_code == 200
```

`GET /` should show the home page, `index.html`. Pass `html=True` to `StaticFiles`.

```py
r = await client.get('/')
assert 'Intelligent Hostel Management System' in r.text
```

`GET /student.html` should show the student page.

```py
r = await client.get('/student.html')
assert r.status_code == 200
assert 'complaint-form' in r.text
```

`GET /js/student.js` should send the script.

```py
r = await client.get('/js/student.js')
assert r.status_code == 200
assert 'fetch' in r.text
```

`GET /api/health` should still answer `{"status": "ok"}`. The mount must come after the API route.

```py
r = await client.get('/api/health')
assert r.json() == {'status': 'ok'}
```

A file that is not in `frontend` should give a 404.

```py
r = await client.get('/missing.html')
assert r.status_code == 404
```

## --solutions--

```python file=main.py
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="IHMS")


@app.get("/api/health")
def health():
    return {"status": "ok"}


# The mount goes last. It answers every path the routes above did not.
FRONTEND = Path(__file__).parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND, html=True), name="frontend")
```

```html file=frontend/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>IHMS</title>
  </head>
  <body>
    <h1>Intelligent Hostel Management System</h1>
    <p>Apply for a bed space, report a fault, and follow it until it's fixed.</p>
    <a href="student.html">Student Portal</a>
  </body>
</html>
```

```html file=frontend/student.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Student Portal</title>
    <script src="js/student.js" defer></script>
  </head>
  <body>
    <h1>Student Portal</h1>
    <form id="complaint-form">
      <label for="description">What's wrong?</label>
      <textarea id="description" rows="4" required></textarea>
      <button type="submit">Submit complaint</button>
    </form>
    <p id="message"></p>
  </body>
</html>
```

```js file=frontend/js/student.js
const form = document.querySelector("#complaint-form");
const message = document.querySelector("#message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const description = document.querySelector("#description").value;

  const response = await fetch("/api/complaints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    message.textContent = "Please describe the problem in at least 10 characters.";
    return;
  }
  const complaint = await response.json();
  const due = new Date(complaint.deadline).toLocaleString("en-NG");
  message.textContent = `Received. ${complaint.urgency} ${complaint.category} complaint. Deadline: ${due}.`;
  form.reset();
});
```

## --why--

`StaticFiles` answers a request by sending the matching file from the folder. Mounted last at `/`, it catches every path the API routes did not, and `html=True` makes `/` show `index.html`.

# --screen-- checklist

## --items--

- On your laptop, mount the frontend at the bottom of `backend/main.py`, with `.parent.parent` in the path. Start the app and open `http://127.0.0.1:8000/`. Your home page should appear.
- Change the complaint form's script so that it sends to `POST /api/complaints` and shows the result.
- Change the staff page so that it loads from `GET /api/complaints` instead of `complaints.json`.
- Lodge a complaint on the student page. Then refresh the staff page. The complaint should be in the list.
