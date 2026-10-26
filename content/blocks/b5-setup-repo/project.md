---
ciJob: lab-setup
---

# --user-stories--

1. You have a public GitHub repository, made from the group template with "Use this template", and cloned to your laptop as `my-ihms`.
2. Your virtual environment is active, and you have installed the libraries from `requirements.txt` into it.
3. `backend/services/triage.py` holds your chapter B4 functions `deadline_hours`, `triage_urgency`, `triage_category` and `triage`.
4. `backend/services/escalation.py` holds your `escalation_level` and `compute_deadline`, and `backend/services/allocation.py` holds your `apply_for_bed`.
5. You have committed and pushed to `main`, and `.venv` and `.env` are not in the repository.
6. The `lab-setup` job in GitHub Actions passes.

# --instructions--

The official test for this project is `tests/official/test_setup.py`, and it also runs on your laptop. It checks the layout of your repository and runs your chapter B4 functions from inside it. Write the code yourself: AI may explain code to you, but it must not write it.

### 1. Check your tools and make your repository

Follow the lessons Installing your tools and Git and GitHub if you have not yet. Then run these in a terminal. `python --version` must show 3.12 or newer. On a Mac, write `python3`.

```bash
python --version
git --version
```

Make your repository from the template at github.com/JudahDevelops/group39-ihms with **Use this template**. Name it `my-ihms` and choose **Public**. Add your GitHub username on the Your profile page of this platform. Then clone it:

```bash
cd ~/Documents
git clone <your repo url> my-ihms
cd my-ihms
```

### 2. Make the environment and install the libraries

In `my-ihms`, make a virtual environment. On a Mac, write `python3`.

```bash
python -m venv .venv
```

Activate it with the command for your system. Your prompt must start with `(.venv)`. Then install the libraries.

| System | Command |
|---|---|
| Windows (PowerShell) | `.venv\Scripts\Activate.ps1` |
| Windows (Command Prompt) | `.venv\Scripts\activate.bat` |
| Mac | `source .venv/bin/activate` |

If PowerShell says running scripts is disabled, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, answer `Y`, then activate again.

```bash
pip install -r requirements.txt
```

Use the `requirements.txt` that came with the template. Installing can take a few minutes.

### 3. Paste your chapter B4 functions

Open `my-ihms` in VS Code. Every file below starts as a stub that raises `NotImplementedError`. Replace the stubs with your own code.

**`backend/services/triage.py`.** Open Step 26 of the workshop Code the Triage and Escalation Rules. Select all the code in its editor (Ctrl+A on Windows, Cmd+A on a Mac) and copy it. In VS Code, select all in `triage.py` and paste. Then do two things:

- Cut the function `escalation_level`, from its `def` line to its `return 2`. You paste it into `escalation.py` in a moment.
- Delete the test run at the bottom: the `COMPLAINTS` list, the `for` loop that prints, and the last `print`.

The file now holds `deadline_hours`, `URGENCY_KEYWORDS`, `triage_urgency`, `CATEGORY_KEYWORDS`, `triage_category` and `triage`.

**`backend/services/escalation.py`.** Keep the line `from datetime import datetime, timedelta` at the top. Replace the stubs `escalation_level` and `compute_deadline` with your own. Put `DEADLINE_HOURS` above them, and paste the `escalation_level` you cut from `triage.py`. Write `compute_deadline(created_at, urgency)` as you did in the last task of the lesson Dates and times. The platform does not keep lesson answers, so write it again. Leave `notify_escalation` and `check_overdue` as they are: later chapters fill them in.

**`backend/services/allocation.py`.** Open your lab Build the Room Allocation Function. Copy `apply_for_bed`, and every helper function it calls, over the stub in `allocation.py`. You do not need the sample lists at the top of the lab.

### 4. Run the official test

Run the same test that GitHub will run. Start in the `my-ihms` folder, with the environment active. This lab needs no database.

```bash
python -m pytest -c tests/official/pytest.ini tests/official/test_setup.py
```

The last line should show only passed tests. A failure names the function and shows what it returned. Fix your code, save, and run it again.

### 5. Commit and push

```bash
git status
git add .
git commit -m "Add my chapter B4 functions"
git push
```

`git status` must not list `.venv` or `.env`. The template's `.gitignore` already skips them. If a window asks you to sign in to GitHub, sign in through the browser it opens. Never type your password into the terminal.

### 6. Read the result on GitHub

Open the Actions tab of your repository and click the latest run. Wait until the jobs stop spinning. Only `lab-setup` counts for this project. The other jobs belong to later projects and stay red for now.

If `lab-setup` is red, click it, open the step **Run lab-setup**, and read the first line that starts with `FAILED`. Fix it on your laptop, then commit and push again.

Paste the link to your repository below and press **Check my repo**.
