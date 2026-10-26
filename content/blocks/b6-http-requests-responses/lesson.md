# --screen-- concept

**HTTP** is the language browsers and servers use. Every exchange is one **request** and one **response**. The app below is already written. Press Run, then press Send in the Requests panel. What comes back is the response.

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

NOTICES = [
    {"id": 1, "title": "Water will be off on Friday"},
    {"id": 2, "title": "Hall meeting at 6 pm"},
]


class NoticeIn(BaseModel):
    title: str


@app.get("/notices")
def list_notices():
    return NOTICES


@app.get("/notices/{notice_id}")
def get_notice(notice_id: int):
    for notice in NOTICES:
        if notice["id"] == notice_id:
            return notice
    raise HTTPException(status_code=404, detail="Notice not found")


@app.post("/notices", status_code=201)
def create_notice(body: NoticeIn):
    notice = {"id": len(NOTICES) + 1, "title": body.title}
    NOTICES.append(notice)
    return notice


@app.delete("/notices/{notice_id}")
def delete_notice(notice_id: int):
    for notice in NOTICES:
        if notice["id"] == notice_id:
            NOTICES.remove(notice)
            return notice
    raise HTTPException(status_code=404, detail="Notice not found")


@app.get("/me")
def me():
    raise HTTPException(status_code=401, detail="Not logged in")


@app.get("/staff/notices")
def staff_notices():
    raise HTTPException(status_code=403, detail="Staff only")
```
:::

## --callout-- info

You will write apps like this one from lesson 12.1. For now, only send requests.

# --screen-- concept

A URL has five pieces. Here is one, taken apart: `http://127.0.0.1:8000/api/complaints?status=Open`

| Piece | Here | Means |
|---|---|---|
| Scheme | `http` | The protocol (`https` when encrypted) |
| Host | `127.0.0.1` | The computer. It means "this computer". |
| Port | `8000` | Which program on that computer |
| Path | `/api/complaints` | Which resource |
| Query | `?status=Open` | Extra options |

# --screen-- match

## --prompt--

Match each piece of the URL to what it means.

## --pairs--

- `http`
  - The protocol
- `127.0.0.1`
  - This computer
- `8000`
  - Which program on that computer
- `/api/complaints`
  - Which resource
- `?status=Open`
  - Extra options

## --why--

The scheme says how to talk, the host says which computer, the port says which program on it, the path says which resource, and the query adds options.

# --screen-- tapbuild

## --prompt--

Build the URL that asks this computer, on port 8000, for the open complaints.

## --template--

```text
http://___:8000/api/complaints___
```

## --tokens--

- `127.0.0.1`
- `google.com`
- `?status=Open`
- `&status=Open`
- `/status/Open`

## --answer--

- `127.0.0.1`
- `?status=Open`

## --why--

`127.0.0.1` is this computer, so the request never leaves your machine. A query starts with `?`. An `&` only joins a second option to a first, and `/status/Open` would be a path.

# --screen-- concept

The **method** says what you want to do.

| Method | Means | IHMS example |
|---|---|---|
| `GET` | Read | List complaints |
| `POST` | Create | Lodge a complaint |
| `PATCH` | Change part of something | Move a complaint to "In Progress" |
| `DELETE` | Remove | Rarely used here |

Try it. Choose `POST`, path `/notices`, body `{"title": "Fire drill on Tuesday"}`, then Send. Then send `GET /notices`.

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

NOTICES = [
    {"id": 1, "title": "Water will be off on Friday"},
    {"id": 2, "title": "Hall meeting at 6 pm"},
]


class NoticeIn(BaseModel):
    title: str


@app.get("/notices")
def list_notices():
    return NOTICES


@app.get("/notices/{notice_id}")
def get_notice(notice_id: int):
    for notice in NOTICES:
        if notice["id"] == notice_id:
            return notice
    raise HTTPException(status_code=404, detail="Notice not found")


@app.post("/notices", status_code=201)
def create_notice(body: NoticeIn):
    notice = {"id": len(NOTICES) + 1, "title": body.title}
    NOTICES.append(notice)
    return notice


@app.delete("/notices/{notice_id}")
def delete_notice(notice_id: int):
    for notice in NOTICES:
        if notice["id"] == notice_id:
            NOTICES.remove(notice)
            return notice
    raise HTTPException(status_code=404, detail="Notice not found")


@app.get("/me")
def me():
    raise HTTPException(status_code=401, detail="Not logged in")


@app.get("/staff/notices")
def staff_notices():
    raise HTTPException(status_code=403, detail="Staff only")
```
:::

# --screen-- mcq

## --question--

Which method creates something?

## --options--

- [ ] `GET`
  > No. `GET` only reads. Asking for the complaints does not change them.
- [x] `POST`
  > Yes. `POST` sends data to the server so that it creates something, such as a new complaint.
- [ ] `PATCH`
  > No. `PATCH` changes part of something that already exists.
- [ ] `DELETE`
  > No. `DELETE` removes something.

## --why--

Read with `GET`, create with `POST`, change part of something with `PATCH`, remove with `DELETE`.

# --screen-- spotbug

## --code--

```text
GET /api/complaints

{"description": "The pipe in the bathroom has burst"}
```

## --question--

This request is meant to lodge a complaint, but it does not do that. What is wrong?

## --options--

- [x] It uses `GET`. Creating a complaint needs `POST`.
  > Yes. `GET` only reads. The same path with `POST` is the one that lodges a complaint.
- [ ] The path should be `/api/complaint`, in the singular.
  > No. `/api/complaints` is the path for the whole set of complaints. The method is what is wrong.
- [ ] The body needs single quotes.
  > No. JSON always uses double quotes.
- [ ] The body should come before the path.
  > No. A request starts with the method and the path. The body comes last.

## --why--

The path names the resource and the method says what to do with it. The same path can read with `GET` and create with `POST`.

# --screen-- concept

Every response has a **status code**, a three-digit number. 2xx means it worked. 4xx means the request had a problem.

| Code | Meaning | When we use it |
|---|---|---|
| 200 | OK | A successful read |
| 201 | Created | A complaint was lodged |
| 400 | Bad request | Fees not cleared |
| 409 | Conflict | No vacant bed, or already allocated |

# --screen-- concept

Press Run, then send `GET /me`, `GET /staff/notices`, `GET /notices/99` and `POST /notices` with the body `{}`.

| Code | Meaning | When we use it |
|---|---|---|
| 401 | Not logged in | No token, or an expired one |
| 403 | Forbidden | A student calling an admin endpoint |
| 404 | Not found | No complaint with that ID |
| 422 | Invalid data | A description that's too short (FastAPI sends this for you) |

::: tryit fastapi
```python file=main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

NOTICES = [
    {"id": 1, "title": "Water will be off on Friday"},
    {"id": 2, "title": "Hall meeting at 6 pm"},
]


class NoticeIn(BaseModel):
    title: str


@app.get("/notices")
def list_notices():
    return NOTICES


@app.get("/notices/{notice_id}")
def get_notice(notice_id: int):
    for notice in NOTICES:
        if notice["id"] == notice_id:
            return notice
    raise HTTPException(status_code=404, detail="Notice not found")


@app.post("/notices", status_code=201)
def create_notice(body: NoticeIn):
    notice = {"id": len(NOTICES) + 1, "title": body.title}
    NOTICES.append(notice)
    return notice


@app.delete("/notices/{notice_id}")
def delete_notice(notice_id: int):
    for notice in NOTICES:
        if notice["id"] == notice_id:
            NOTICES.remove(notice)
            return notice
    raise HTTPException(status_code=404, detail="Notice not found")


@app.get("/me")
def me():
    raise HTTPException(status_code=401, detail="Not logged in")


@app.get("/staff/notices")
def staff_notices():
    raise HTTPException(status_code=403, detail="Staff only")
```
:::

# --screen-- match

## --prompt--

Match each status code to the moment the IHMS uses it.

## --pairs--

- `400`
  - Fees not cleared
- `401`
  - No token, or an expired one
- `403`
  - A student calling an admin endpoint
- `404`
  - No complaint with that ID
- `409`
  - No vacant bed, or already allocated
- `422`
  - A description that's too short

## --why--

A 4xx code means the request had a problem, and each one names the problem. 401 is about who you are. 403 is about what you may do. 404 is about what exists.

# --screen-- mcq

## --question--

A student who is logged in calls an admin-only endpoint. Which code does the server send?

## --options--

- [ ] 401
  > No. 401 means the server does not know who you are, for example when there is no token. This student is logged in.
- [x] 403
  > Yes. The server knows who the student is, and that student is not allowed to use this endpoint.
- [ ] 404
  > No. 404 means nothing exists at that address. The endpoint exists. The student may not use it.
- [ ] 409
  > No. 409 means the request clashes with the current state, such as a bed that is already taken.

## --why--

401 means "I do not know who you are". 403 means "I know who you are, and you may not do this".

# --screen-- concept

**Headers** carry extra details about a request or a response. You will use two. `Content-Type: application/json` says the body is JSON. `Authorization: Bearer <token>` says who is logged in. `<token>` stands for the long text that login gives you.

## --code--

```text
POST /api/complaints
Content-Type: application/json
Authorization: Bearer <token>

{"description": "The pipe in the bathroom has burst"}
```

# --screen-- mcq

## --question--

Which header says that the body of a request is JSON?

## --options--

- [ ] `Authorization: Bearer <token>`
  > No. That header says who is logged in.
- [x] `Content-Type: application/json`
  > Yes. `Content-Type` names the kind of data in the body, and `application/json` is JSON.
- [ ] `Method: POST`
  > No. The method is the first word of the request itself. It is not a header.
- [ ] `Status: 201`
  > No. The status code belongs to a response, not to a request.

## --why--

Without `Content-Type: application/json`, the server may not read the body as JSON. You will meet this again in lesson 12.4.

# --screen-- checklist

## --items--

- Open any website, press F12, and open the **Network** tab. Reload the page.
- Click one request in the list. Find its method, its status code and its `Content-Type`.
