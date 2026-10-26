# --screen-- concept

FastAPI turns Python functions into web addresses. This app has one endpoint, `GET /api/health`. Press Run to start it, then press Send in the Requests panel.

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI

app = FastAPI(title="IHMS")


@app.get("/api/health")
def health():
    return {"status": "ok"}
```
:::

## --callout-- tip

On your laptop you start an app with `fastapi dev main.py`. Here, Run does that for you.

# --screen-- concept

`app = FastAPI(title="IHMS")` creates the app. `@app.get("/api/health")` is a **decorator**: a line starting with `@`, right above a function. It tells FastAPI: when a GET request comes to this path, run the function below and send back what it returns as JSON.

## --code--

```python file=main.py
from fastapi import FastAPI

app = FastAPI(title="IHMS")


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

# --screen-- mcq

## --question--

What does `@app.get("/api/health")` do?

## --options--

- [x] Runs the function below it for GET requests to that path
  > Yes. The decorator ties a method and a path to a function.
- [ ] Fetches a web page
  > No. Fetching a page is what a browser does. The decorator is on the server, and it waits for requests.
- [ ] Creates the app
  > No. The app is created by `FastAPI(...)`. The decorator adds a route to an app that already exists.
- [ ] Runs the function once, when the file loads
  > No. The function runs each time a matching request arrives.

## --why--

A decorator connects an address to a function. FastAPI calls the function whenever a request for that address arrives.

# --screen-- tapbuild

## --prompt--

Build the route for `GET /api/health`.

## --template--

```python
@___.get("___")
def health():
    return {"status": "ok"}
```

## --tokens--

- `app`
- `FastAPI`
- `/api/health`
- `api/health`
- `health`

## --answer--

- `app`
- `/api/health`

## --why--

The decorator belongs to the app you created, so it starts with `@app`. The path starts with `/`, as it does in a URL. `FastAPI` is the class that makes the app, and `health` is the name of the function below.

# --screen-- predict

## --code--

```python file=main.py
from fastapi import FastAPI

app = FastAPI(title="IHMS")


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

## --question--

What does `GET /api/health` send back?

## --options--

- [x] The JSON `{"status": "ok"}`, with status 200
  > Yes. FastAPI turns the returned dictionary into JSON and answers 200 OK.
- [ ] The word `health`
  > No. `health` is only the name of the Python function. The reply is what the function returns.
- [ ] A 404, because there is no page called health
  > No. The decorator creates the route, so the address exists.
- [ ] The text `ok`
  > No. The function returns a whole dictionary, `status` and `ok` together, and FastAPI sends all of it.

## --why--

Whatever the function returns, FastAPI sends as JSON.

# --screen-- spotbug

## --code--

```python file=main.py
from fastapi import FastAPI


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

## --question--

Python stops with `NameError: name 'app' is not defined`. What is missing?

## --options--

- [x] The line that creates the app: `app = FastAPI(title="IHMS")`
  > Yes. The decorator uses `app`, so the app has to exist before the route is added.
- [ ] An import for `app`
  > No. `app` is not imported. You create it yourself with `FastAPI(...)`.
- [ ] A parameter in `health()`
  > No. A function without parameters is fine for a route with no input.
- [ ] Quotation marks around `app` in the decorator
  > No. `app` is a variable, not text. It must stay without quotation marks.

## --why--

Create the app first with `app = FastAPI(...)`. Then every `@app...` decorator below it has an app to attach to.

# --screen-- match

## --prompt--

The name of the decorator is the name of the method. Match each decorator to what it answers.

## --pairs--

- `@app.get`
  - A request that reads
- `@app.post`
  - A request that creates
- `@app.patch`
  - A request that changes part of something
- `@app.delete`
  - A request that removes

## --why--

Use `@app.post` for lodging a complaint and `@app.get` for listing them. The same path can have several decorators, one for each method.

# --screen-- order

## --prompt--

Put in order what happens when the browser asks for `/api/health`.

## --items--

- The browser sends `GET /api/health`
- FastAPI finds the function whose decorator has that method and path
- The function `health` runs and returns a dictionary
- FastAPI turns the dictionary into JSON and sends it back with status 200

## --why--

The request picks the function, the function makes the answer, and FastAPI turns the answer into the response.

# --screen-- typein

## --prompt--

Add `GET /api/info`. It returns the name of the system and our group number: `{"name": "IHMS", "group": 39}`.

## --seed-contents--

```python file=main.py
from fastapi import FastAPI

app = FastAPI(title="IHMS")


@app.get("/api/health")
def health():
    return {"status": "ok"}


--editable-region--

--editable-region--
```

## --tests--

Your app should answer `GET /api/info` with status 200. Check the decorator: `@app.get("/api/info")`.

```py
r = await client.get('/api/info')
assert r.status_code == 200
```

The reply should have a `name` key with some text, such as `IHMS`.

```py
r = await client.get('/api/info')
name = r.json().get('name')
assert isinstance(name, str) and name.strip() != ''
```

The reply should have a `group` key with our group number, `39`. Write the number without quotation marks.

```py
r = await client.get('/api/info')
assert r.json().get('group') == 39
```

`GET /api/health` should still answer `{"status": "ok"}`.

```py
r = await client.get('/api/health')
assert r.json() == {'status': 'ok'}
```

## --solutions--

```python file=main.py
from fastapi import FastAPI

app = FastAPI(title="IHMS")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/info")
def info():
    return {"name": "IHMS", "group": 39}
```

## --why--

A new endpoint needs a new decorator and a new function with a different name. Returning a dictionary is enough: FastAPI turns it into JSON.

# --screen-- concept

FastAPI also writes interactive documentation for your API, at `/docs`. On your laptop, open it in the browser, click an endpoint, then *Try it out*, then *Execute*. The paper gives this as one reason for choosing FastAPI. In this course, the Requests panel does the same job.

# --screen-- mcq

## --question--

Where does FastAPI show interactive documentation?

## --options--

- [x] `/docs`
  > Yes. FastAPI writes this page for you from your routes.
- [ ] `/help`
  > No. FastAPI does not make a `/help` page.
- [ ] `/api/health`
  > No. That is the health endpoint from this lesson. It answers with JSON, not with documentation.
- [ ] `/main.py`
  > No. Your code is never served as a page. Only the routes you write answer requests.

## --why--

`/docs` lists every endpoint and lets you try it. It updates by itself when you add a route.

# --screen-- concept

On your laptop, run the app from the `backend` folder. `fastapi dev` restarts the server every time you save a file. Stop it with Ctrl+C.

## --code--

```bash
fastapi dev main.py
```

## --callout-- info

The server stays running in its terminal window. Open a second terminal for other commands.

# --screen-- checklist

## --items--

- Install FastAPI with `pip install "fastapi[standard]"`, with your virtual environment active. Then run the command below and paste what it prints.
  - command: `pip show fastapi`
  - pattern: `Name:\s*fastapi`
  - hint: If pip says the package was not found, FastAPI is not in this virtual environment. Check that the environment is active, then run the install command again.
- Write the health route in `backend/main.py`, and start the app with `fastapi dev main.py` in one terminal. In a second terminal, run the command below and paste what it prints.
  - command: `curl http://127.0.0.1:8000/api/health`
  - pattern: `"status"\s*:\s*"ok"`
  - hint: You should see `{"status":"ok"}`. If curl cannot connect, check that the first terminal still shows the server running, and that you are in the `backend` folder.
- Open `http://127.0.0.1:8000/docs` in your browser. Click `/api/health`, then *Try it out*, then *Execute*.
- Add `GET /api/info` to `main.py`, save, and check that it works from `/docs`.
