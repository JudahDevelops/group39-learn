# --screen-- concept

A **module** is a Python file. Split your code across files, then `import` what you need. Press Run: `main.py` imports `deadline_hours` from `services/triage.py`. Change `"urgent"` to `"low"` and run again.

::: tryit python
```python file=main.py
from services.triage import deadline_hours

print(deadline_hours("urgent"))
```

```python file=services/triage.py
def deadline_hours(urgency: str) -> int:
    if urgency == "urgent":
        return 24
    if urgency == "normal":
        return 72
    return 168
```
:::

# --screen-- concept

Read the import line from left to right: from the folder `services`, the file `triage` (leave out `.py`), bring in `deadline_hours`.

## --code--

```python file=main.py
from services.triage import deadline_hours
```

# --screen-- tapbuild

## --prompt--

Build the line that brings `escalation_level` from the file `services/escalation.py` into `main.py`.

## --template--

```python
___ services.escalation ___ escalation_level
```

## --tokens--

- `from`
- `import`
- `require`
- `include`

## --answer--

- `from`
- `import`

## --why--

Python says where something is first, with `from`, and then what to bring in, with `import`. `require` is JavaScript, and Python has no `include`.

# --screen-- spotbug

## --code--

```python file=main.py
from services.triage.py import deadline_hours
```

## --question--

Python stops with a `ModuleNotFoundError`. What is wrong with the import line?

## --options--

- [x] The `.py` must be left out: `services.triage`.
  > Yes. Python adds `.py` itself. With it written, Python looks for a folder called `triage.py`.
- [ ] `deadline_hours` should be in quotes.
  > No. A name that you import is written without quotes.
- [ ] The word `from` should come after `import`.
  > No. In Python, `from` comes first.
- [ ] `services` must start with a capital letter.
  > No. The folder is called `services`, and the spelling must match it exactly.

## --why--

In an import line, dots separate folders and the file name. The extension never appears.

# --screen-- concept

Each project keeps its own copy of the libraries it uses, so projects do not clash. This private copy is a **virtual environment**. Make one from your project's top folder.

## --code--

```bash
python -m venv .venv
```

## --callout-- info

On a Mac, write `python3`. The command makes a folder called `.venv`. You never edit what is inside it.

# --screen-- concept

Activate the environment every time you open a new terminal for the project. Your prompt then starts with `(.venv)`.

| System | Command |
|---|---|
| Windows (PowerShell) | `.venv\Scripts\Activate.ps1` |
| Windows (Command Prompt) | `.venv\Scripts\activate.bat` |
| Mac | `source .venv/bin/activate` |

## --callout-- warning

If PowerShell says running scripts is disabled, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, answer `Y`, then activate again. Or use Command Prompt, where `dir` replaces `ls`.

# --screen-- mcq

## --question--

Why use a virtual environment?

## --options--

- [x] Each project keeps its own library versions.
  > Yes. One project can use one version of a library while another uses a different one, with no clash.
- [ ] It makes Python run faster.
  > No. The speed of your code does not change.
- [ ] It saves your code to GitHub.
  > No. Git and GitHub do that. A virtual environment only holds libraries.
- [ ] It stops other people from reading your code.
  > No. An environment holds libraries, not your code, and it protects nothing.

## --why--

Libraries get updated and sometimes change. A separate environment per project means an update for one project cannot break another.

# --screen-- order

## --prompt--

Put the steps for starting work on a new project in order.

## --items--

- Open a terminal in the project's top folder
- Make the environment with `python -m venv .venv`
- Activate the environment
- Install a library with `pip install pytest`

## --why--

Activate before you install. A library installed before activation goes to your main Python, not into the project's environment.

# --screen-- spotbug

## --code--

```text
> python -m venv .venv
> pip install pytest
> .venv\Scripts\Activate.ps1
> python -m pytest
No module named pytest
```

## --question--

pytest was installed, but Python says it cannot find it. What went wrong?

## --options--

- [x] `pip install pytest` ran before the environment was active, so pytest went to the wrong Python.
  > Yes. The environment was activated after the install. Activate first, then install.
- [ ] The environment should be called `venv`.
  > No. The name `.venv` is fine, and the repository's `.gitignore` expects it.
- [ ] pytest cannot be installed with `pip`.
  > No. `pip install pytest` is the right command.
- [ ] `Activate.ps1` needs a capital `P`.
  > No. The script name is spelled correctly. The problem is the order of the lines.

## --why--

`pip` installs into whichever Python is active. Check that your prompt starts with `(.venv)` before you install anything.

# --screen-- concept

`pip` installs libraries into the active environment. A file called `requirements.txt` lists the libraries a project needs, so anyone can install the same ones with one command.

## --code--

```bash
pip install -r requirements.txt
```

## --callout-- warning

Your IHMS repository already has the group's `requirements.txt`. Install from it. Do not replace it with the output of `pip freeze`.

# --screen-- mcq

## --question--

What does `requirements.txt` hold?

## --options--

- [x] The list of libraries the project needs
  > Yes. `pip install -r requirements.txt` reads that list and installs each one.
- [ ] Your code
  > No. Your code is in `.py` files. This file lists libraries only.
- [ ] Your passwords and keys
  > No. Passwords and keys never go in a file that is committed. They go in `.env`.
- [ ] The tests for your project
  > No. Tests are in files named `test_*.py`.

## --why--

One list means every member installs the same libraries.

# --screen-- match

## --prompt--

Match each command to what it does.

## --pairs--

- `python -m venv .venv`
  - Makes the environment
- `source .venv/bin/activate`
  - Switches the terminal into the environment on a Mac
- `pip install pytest`
  - Adds one library to the active environment
- `pip install -r requirements.txt`
  - Installs every library on the list

## --why--

Make the environment once. Activate it in every new terminal. Install into it while it is active.

# --screen-- checklist

## --items--

- Go into the `practice` folder. Make the environment. Activate it: use the PowerShell command from the table, Command Prompt if PowerShell refuses, or `source` on a Mac. Then run the command below and paste what it prints.
  - command: `python -c "import sys; print(sys.prefix)"`
  - pattern: `\.venv`
  - hint: The path should end with `.venv`. If it does not, the environment is not active. Check that your prompt starts with `(.venv)`, and run the activate command again. On a Mac, write `python3 -m venv .venv` to make it.

# --screen-- checklist

## --items--

- In VS Code, open `practice`. Inside `backend`, make a folder called `services`, and in it the files `triage.py` and `escalation.py`.
- Open Step 26 of the workshop Code the Triage and Escalation Rules. Copy `URGENCY_KEYWORDS` and `triage_urgency` into `triage.py`. Copy `escalation_level` into `escalation.py`.
- In `backend`, make `main.py`. Import `triage_urgency` and `escalation_level`, then print `triage_urgency("The pipe in the bathroom has burst")` and `escalation_level(30, 24)`.
- Go into the `backend` folder with the environment active. Run the command below and paste what it prints.
  - command: `python main.py`
  - pattern: `^(?=[\s\S]*^urgent\s*$)(?=[\s\S]*^1\s*$)`
  - hint: You should see `urgent` on one line and `1` on the next. `ModuleNotFoundError` means you are not in the `backend` folder, or the folder is not called `services`. `NameError` means a copied function needs a name you did not copy, such as `URGENCY_KEYWORDS`.
