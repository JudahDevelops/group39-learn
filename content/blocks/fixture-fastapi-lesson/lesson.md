# --screen-- concept

FastAPI turns Python functions into web addresses. A function under `@app.get("/rooms")` answers requests for `/rooms`. Press Run to start the app, then press Send in the Requests panel to ask it for `/rooms`.

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/rooms")
def list_rooms():
    return [{"number": "A-101", "beds": 4}, {"number": "A-102", "beds": 2}]
```
:::

## --callout-- tip

Every Run starts your app again from the code on screen. Nothing you send can break it.

# --screen-- typein

## --prompt--

Add a route for `GET /hello` that returns the dictionary `{"message": "Hello, Hall A"}`.

## --seed-contents--

```python file=main.py
from fastapi import FastAPI

app = FastAPI()

--editable-region--

--editable-region--
```

## --tests--

Your app should answer `GET /hello` with status 200.

```py
r = await client.get('/hello')
assert r.status_code == 200
```

The reply should be `{"message": "Hello, Hall A"}`.

```py
r = await client.get('/hello')
assert r.json() == {'message': 'Hello, Hall A'}
```

## --solutions--

```python file=main.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/hello")
def hello():
    return {"message": "Hello, Hall A"}
```

## --why--

The decorator `@app.get("/hello")` ties the address to the function. FastAPI turns the dictionary the function returns into JSON.
