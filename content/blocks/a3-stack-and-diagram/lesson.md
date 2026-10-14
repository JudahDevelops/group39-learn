# --screen-- concept

The lecturer's slide says:

> *Do not select tech stacks just because of popularity.*

So every technology in our stack needs a reason. The paper gives one for each in Table VI. The course scope already fixes FastAPI for the backend, a relational database, and plain HTML, CSS and JavaScript for the frontend.

# --screen-- concept

The first three parts of the stack, and why.

| Part | Technology | Reason |
|---|---|---|
| Frontend | HTML, CSS, JavaScript (Fetch API) | Runs in any browser with no build step. The portals are forms, tables and status lists |
| Backend | FastAPI (Python) with Pydantic | Checks every request and generates interactive API documentation, which speeds up endpoint testing |
| Database | PostgreSQL with SQLAlchemy | Relational integrity for allocations. Unique constraints prevent double allocation. Time-zone-aware timestamps keep deadlines accurate |

# --screen-- concept

The other four parts.

| Part | Technology | Reason |
|---|---|---|
| Scheduling | APScheduler | Runs the 15-minute escalation check inside the FastAPI process, so no separate server is needed |
| Notifications | SMTP email | Works with existing university email accounts at no per-message cost |
| Security | bcrypt password hashing, JSON Web Tokens | Well-supported session handling for role-based access |
| Triage classifier (optional) | TypeSafe Jev API | Reads free-text complaints beyond a fixed keyword list, at US$0.042 per million input tokens |

# --screen-- match

## --prompt--

Match each part of the stack to its technology.

## --pairs--

- Frontend
  - HTML, CSS, JavaScript (Fetch API)
- Backend
  - FastAPI (Python) with Pydantic
- Database
  - PostgreSQL with SQLAlchemy
- Scheduling
  - APScheduler
- Notifications
  - SMTP email
- Security
  - bcrypt password hashing, JSON Web Tokens
- Triage classifier (optional)
  - TypeSafe Jev API

## --why--

Each part of the stack has one technology, and each choice has a reason in Table VI.

# --screen-- mcq

## --question--

Which is a valid reason for choosing PostgreSQL?

## --options--

- [ ] It is the most popular database
  > No. The lecturer's slide warns against choosing a technology just because of popularity.
- [x] Unique constraints stop double allocation at the database level
  > Yes. That is a reason tied to what the IHMS needs, and it is the one in Table VI.
- [ ] It generates interactive API documentation
  > No. That is a reason for FastAPI, in the backend. PostgreSQL stores the data.

## --why--

A valid reason names something the project needs. Popularity is not one.

# --screen-- mcq

## --question--

Why does the stack include APScheduler?

## --options--

- [ ] It sends the escalation emails
  > No. Sending email is the job of SMTP and the Email Notification Service. APScheduler only starts the check.
- [x] It runs the 15-minute escalation check inside the FastAPI process
  > Yes. No separate server is needed to run the timer.
- [ ] It is the scheduler most developers use
  > No. Popularity is not a reason. The reason is that it runs inside FastAPI.

## --why--

APScheduler is the timer that starts flow F3, and it lives inside the FastAPI server.

# --screen-- concept

**Why not React or MERN?** MERN means MongoDB, Express, React and Node.js. Two of the reviewed systems used it: Kumar et al. (2026) and Gnanagurusubbiah et al. (2026).

Our course scope fixes FastAPI and a relational database. Our portals are forms, tables and status lists, so they do not need React.

# --screen-- mcq

## --question--

What does MERN stand for?

## --options--

- [x] MongoDB, Express, React, Node.js
  > Yes. It is a JavaScript stack that two of the reviewed systems used.
- [ ] MySQL, Express, Ruby, Nginx
  > No. The M is MongoDB, the R is React and the N is Node.js.
- [ ] Modules, Endpoints, Requests, Networks
  > No. MERN is a stack of four technologies, not four ideas.

## --why--

MERN is MongoDB, Express, React and Node.js. Our stack uses none of them.

# --screen-- mcq

## --question--

Someone adds an "AI Chatbot" box to the diagram, but nobody plans to build it. What should happen?

## --options--

- [x] Remove it
  > Yes. Every box in the diagram must become a module that is built.
- [ ] Keep it, because it looks impressive
  > No. A box nobody builds is a claim the project cannot defend.
- [ ] Keep it and say it is future work
  > No. The lecturer's rule says every box must translate into an implemented module. A box for future work breaks it.

## --why--

The diagram holds only what we will build. If a box is in it, you must be able to explain it and have built it.

# --screen-- concept

The lecturer's Don'ts include *do not draw architecture diagrams you cannot explain*.

Drawing the diagram from memory is the fastest way to find out whether you really know it. You will draw it in diagrams.net, first with the steps below and then from memory.

# --screen-- checklist

## --items--

- Open app.diagrams.net. It is free and needs no account.
- Draw four horizontal bands, top to bottom: Client, Logic, Data, Output.
- Add one box per component from Lesson 3.3.
- Make the ★ engine stand out with a different colour and a ★.
- Draw arrows between tiers and label what moves: "HTTPS / JSON", "SQL", "SMTP email".
- Draw the diagram again from memory. Compare it with Figure 3.2 of the paper and list anything you missed.

# --screen-- concept

Now compare your drawing with Figure 3.2 of the paper. List every box, arrow or label you missed.

![Figure 3.2: Four-Tier System Architecture of the IHMS](/img/paper/fig-architecture.webp)

# --screen-- flashcard

## --question--

Give a reason for every technology in the stack.

## --answer--

- **Frontend, HTML, CSS and JavaScript:** runs in any browser with no build step. The portals are forms, tables and status lists.
- **Backend, FastAPI with Pydantic:** checks every request and generates interactive API documentation, which speeds up endpoint testing.
- **Database, PostgreSQL with SQLAlchemy:** unique constraints prevent double allocation, and time-zone-aware timestamps keep deadlines accurate.
- **Scheduling, APScheduler:** runs the 15-minute escalation check inside FastAPI, with no separate server.
- **Notifications, SMTP email:** works with existing university email accounts at no per-message cost.
- **Security, bcrypt and JSON Web Tokens:** well-supported session handling for role-based access.
- **Triage classifier (optional), TypeSafe Jev API:** reads free-text complaints beyond a fixed keyword list, at US$0.042 per million input tokens.
