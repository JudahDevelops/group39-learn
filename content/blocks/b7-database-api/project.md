---
ciJob: lab-db
---

# --user-stories--

1. You work in your `my-ihms` repository from the last project, with your virtual environment active.
2. `backend/.env` holds `DATABASE_URL` for your `ihms` database and `TEST_DATABASE_URL` for a second, empty database called `ihms_test`. Git does not track the file.
3. `backend/schema.sql` creates the seven tables and the two partial unique indexes of the IHMS database.
4. `backend/database.py` builds `engine`, `SessionLocal`, `Base` and `get_db()` from `DATABASE_URL`, with no password in the code.
5. `backend/models.py` has a model for each of the seven tables: `Hostel`, `Room`, `BedSpace`, `User`, `Allocation`, `Complaint` and `ComplaintHistory`.
6. `GET /api/health` answers `{"status": "ok"}`. `POST /api/complaints` saves a complaint and its first history row in PostgreSQL. `GET /api/complaints` and `GET /api/complaints/{id}` read them back.
7. Complaints are still there after you stop and restart the server.
8. `tests/official/test_db.py` passes on your laptop.
9. You have committed and pushed to `main`, `.env` is not in the repository, and the `lab-db` job in GitHub Actions passes.

# --instructions--

The official test for this project is `tests/official/test_db.py`, and it also runs on your laptop. It builds a clean database from your `schema.sql`, then checks your models and your complaint endpoints against it. Write the code yourself: AI may explain code to you, but it must not write it.

This project builds on the lesson Connect FastAPI to PostgreSQL with SQLAlchemy and the workshop Connect FastAPI to the Database. Work in `my-ihms`, with the environment active (your prompt starts with `(.venv)`). Open the folder in VS Code.

### 1. Make the test database

Open pgAdmin and connect to your server. Right-click **Databases**, choose **Create**, then **Database**, name it `ihms_test` and save. Leave it empty.

**The official test deletes everything in `ihms_test` every time it runs.** The name must contain `test`, and you must never point the test at `ihms`. Your real data lives in `ihms`.

### 2. Make your `.env` file

Start in the `my-ihms` folder. Copy the example file.

| System | Command |
|---|---|
| Windows (PowerShell or Command Prompt) | `copy backend\.env.example backend\.env` |
| Mac | `cp backend/.env.example backend/.env` |

Open `backend/.env` in VS Code. It starts with two addresses:

```text
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/ihms
TEST_DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/ihms_test
```

Replace `YOUR_PASSWORD` in both lines with the `postgres` password you chose when you installed PostgreSQL. **Type it in this file and nowhere else.** Never paste it into the terminal, a chat, the code or this page. Leave the other lines as they are: later projects use them.

On a Mac with Postgres.app there is no password. Delete `:YOUR_PASSWORD` so the lines read `postgresql+psycopg://postgres@localhost:5432/ihms` and `postgresql+psycopg://postgres@localhost:5432/ihms_test`.

Use a password made of letters and digits. A character such as `@`, `:`, `/`, `?`, `#` or `%` breaks the address. If yours has one, change it in pgAdmin: open your server in the left panel, then **Login/Group Roles**, right-click `postgres`, choose **Properties**, open the **Definition** tab and type the new password there. Then put the new one in `.env`.

`.env` must never be committed. The template's `.gitignore` already skips it. You check that at the end.

### 3. Fill in `backend/schema.sql`

`schema.sql` starts as a comment. Open the lesson Set Up the IHMS Database on Your Laptop. On the screen with the Try it box, click inside the box, select all the code (Ctrl+A on Windows, Cmd+A on a Mac) and copy it. In VS Code, select all in `backend/schema.sql` and paste.

It holds the seven tables and the two partial unique indexes, with no sample rows. The official test adds its own rows. It also builds `ihms_test` from this file on an empty database, so the file must run from the first line to the last without an error.

### 4. Write `backend/database.py`

Replace the stub. The file must hold these four names, as in the lesson:

- `engine`, made with `create_engine` from the address in `DATABASE_URL`. Call `load_dotenv()` first, so the address is read from `backend/.env`, and read it with `os.environ["DATABASE_URL"]`.
- `SessionLocal`, made with `sessionmaker(bind=engine)`.
- `Base`, a class built on `DeclarativeBase`.
- `get_db()`, a function that opens a session with `with SessionLocal() as db:` and yields it.

The address must not be written in the code.

### 5. Write `backend/models.py`

Write one model for each table in `schema.sql`, built on `Base` from `database.py`. Open the last step of the workshop Connect FastAPI to the Database and read its `models.py`: it has all seven. Write yours in your own file as you did there, and make sure you can explain every line.

| Model | Table | Columns |
|---|---|---|
| `Hostel` | `hostels` | `id`, `name`, `gender`, `level` |
| `Room` | `rooms` | `id`, `hostel_id`, `number` |
| `BedSpace` | `bed_spaces` | `id`, `room_id`, `label` |
| `User` | `users` | `id`, `full_name`, `email`, `password_hash`, `role`, `gender`, `level`, `fees_cleared`, `unit`, `hostel_id` |
| `Allocation` | `allocations` | `id`, `student_id`, `bed_space_id`, `status`, `created_at` |
| `Complaint` | `complaints` | `id`, `student_id`, `room_id`, `description`, `category`, `urgency`, `status`, `escalation_level`, `created_at`, `deadline`, `resolved_at` |
| `ComplaintHistory` | `complaint_history` | `id`, `complaint_id`, `event`, `actor_id`, `at` |

- A column that ends in `_id` is a foreign key to the table it names. Check `schema.sql` for which one.
- A column may be empty when `schema.sql` has no `not null` on it: `User.gender`, `User.level`, `User.unit`, `User.hostel_id`, `Complaint.resolved_at` and `ComplaintHistory.actor_id`.
- `Complaint.status` starts as `"Open"` and `escalation_level` starts as `0`. `User.fees_cleared` starts as `False` and `Allocation.status` as `"active"`.
- Every moment in time is `DateTime(timezone=True)`. The test checks that a deadline keeps its time zone.
- The database fills in `Allocation.created_at` and `ComplaintHistory.at` itself, so give them `server_default=func.now()`.

Do not call `Base.metadata.create_all`. On your laptop the tables come from `schema.sql`.

### 6. Write the endpoints

Three files, each starting as a stub. Keep the paths and the field names exactly as written here, because the official test sends them.

**`backend/schemas.py`**

- `ComplaintIn`: `student_id` (a whole number), `room_id` (a whole number) and `description` (10 to 1000 characters). Until the login chapter the request says who the student is and which room it is about.
- `ComplaintOut`: `id`, `description`, `category`, `urgency`, `status` and `deadline`, set to read attributes of a model object.

**`backend/routers/complaints.py`**, which already has `router = APIRouter(prefix="/complaints", ...)`. Every function gets its session with `Depends(get_db)`.

| Endpoint | What it does |
|---|---|
| `GET /api/complaints` | A list of `ComplaintOut`, soonest `deadline` first. `?status=Open` keeps only that status |
| `GET /api/complaints/{id}` | One `ComplaintOut`. Status 404 when there is no such id. A word instead of a number gives 422 by itself |
| `POST /api/complaints` | Status 201. Takes `ComplaintIn`, gets the category and urgency from your B4 triage functions in `services/triage.py`, and sets `created_at` to now and `deadline` with `compute_deadline` from `services/escalation.py`. Saves the complaint and one `ComplaintHistory` row with the event `Lodged and triaged as urgent plumbing` (the real urgency and category), in one commit |

If no urgency keyword matches, use `"normal"`. That is a placeholder for an open design decision: see <a href="/reference/decisions" target="_blank" rel="noopener">Group decisions</a>.

**`backend/main.py`** already has `app = FastAPI(title="IHMS")`. Add `GET /api/health`, which returns `{"status": "ok"}`, and include the complaints router with `prefix="/api"`. Leave the `TODO` comments alone: they are for later chapters.

### 7. Run the official test

Start in the `my-ihms` folder, with the environment active. The test reads `TEST_DATABASE_URL` from `backend/.env`, so there is nothing to type first. Run it:

```bash
python -m pytest -c tests/official/pytest.ini tests/official/test_db.py
```

The last line should show only passed tests. A failure names the test and says what is wrong. Fix your code, save, and run it again.

| The test says | What to do |
|---|---|
| `TEST_DATABASE_URL is not set` | Add the `TEST_DATABASE_URL` line to `backend/.env` and save the file |
| `Refusing to wipe database` | The database in `TEST_DATABASE_URL` must have `test` in its name. Use `ihms_test` |
| `backend/schema.sql is empty or missing` | Paste the schema into the file and save it |
| `schema.sql does not run on an empty PostgreSQL database` | Read the error after it. A table may be missing, or the file was pasted twice |
| `password authentication failed` or `connection refused` | The password in `.env` is wrong, or PostgreSQL is not running. Start it, or fix the line |
| `Could not import models` or `database` | The message after it names the line to fix |

### 8. Try it by hand

This shows story 7. In pgAdmin, open the Query Tool on `ihms` (not `ihms_test`) and run these three statements once. They add a hostel, a room and a student for the complaint to point at.

```sql
insert into hostels (name, gender, level) values ('Block A', 'female', 100);
insert into rooms (hostel_id, number) values (1, 'A-101');
insert into users (full_name, email, password_hash, role, gender, level, fees_cleared)
values ('Amina Bello', 'amina.bello@example.com', 'placeholder', 'student', 'female', 100, true);
```

Then start the server from the `backend` folder.

```bash
cd backend
fastapi dev main.py
```

Open `http://127.0.0.1:8000/docs`. Send `POST /api/complaints` with the body below. If pgAdmin shows other ids, run `select id from users;` and `select id from rooms;` and use those.

```json
{ "description": "The pipe in the bathroom has burst", "student_id": 1, "room_id": 1 }
```

Press Ctrl+C in the terminal to stop the server, start it again, and send `GET /api/complaints`. Your complaint is still there, because PostgreSQL kept it. Press Ctrl+C again, and `cd ..` to go back to `my-ihms`.

### 9. Commit and push

```bash
git status
git add .
git commit -m "Connect the API to PostgreSQL"
git push
```

`git status` must not list `.env`. If it does, stop and ask the group before you commit. If a window asks you to sign in to GitHub, sign in through the browser it opens. Never type your password into the terminal.

### 10. Read the result on GitHub

Open the Actions tab of your repository and click the latest run. Wait until the jobs stop spinning. Only `lab-db` counts for this project. GitHub runs it on its own throwaway PostgreSQL, so it needs nothing from your `.env`. The jobs for later projects stay red for now.

If `lab-db` is red, click it, open the step **Run lab-db**, and read the first line that starts with `FAILED`. Fix it on your laptop, run the official test again, then commit and push again.

Paste the link to your repository below and press **Check my repo**.
