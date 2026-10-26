# --screen-- concept

Install these four, then check each one.

| Tool | What it is for | Get it from |
|---|---|---|
| VS Code | The editor you write code in | code.visualstudio.com |
| Python and Live Server extensions | Python support, and pages that refresh when you save | The Extensions tab in VS Code |
| Python 3.12 or newer | Runs the server | python.org |
| Git | Saves versions of your code | git-scm.com |

# --screen-- match

## --prompt--

Match each job to the tool that does it.

## --pairs--

- Write a Python file
  - VS Code
- Run a Python file
  - Python
- Save a version of your project
  - Git
- Refresh your page in the browser each time you save
  - Live Server

## --why--

Each tool does one job. VS Code is where you type, and Python, Git and Live Server work on what you typed.

# --screen-- concept

**Windows:** download VS Code from code.visualstudio.com and run the installer with the default choices. **Mac:** download it, then drag it into Applications.

Open VS Code and click the Extensions tab on the left. Search for **Python** (by Microsoft) and **Live Server**, and press Install on each.

# --screen-- concept

**Windows:** download Python 3.12 or newer from python.org. On the first screen of the installer, tick **Add python.exe to PATH**, then press Install Now. **Mac:** download the macOS installer from python.org and keep the defaults.

## --callout-- warning

Without that tick, your terminal cannot find Python. If you forgot it, uninstall Python and install it again with the box ticked.

# --screen-- mcq

## --question--

What must you tick when you install Python on Windows?

## --options--

- [x] Add python.exe to PATH
  > Yes. PATH is the list of places your terminal looks for programs. Without it, the command `python` is not found.
- [ ] Install launcher for all users
  > No. That choice is about who on the laptop can use Python. It does not help the terminal find it.
- [ ] Use admin privileges when installing py.exe
  > No. That only changes how the installer runs. It does not change what the terminal can find.
- [ ] Disable path length limit
  > No. That is about very long file paths. It has nothing to do with finding the `python` command.

## --why--

The terminal finds a program only if its folder is on the PATH. The tick adds Python's folder for you.

# --screen-- mcq

## --question--

You installed Python, with the PATH box ticked. You then ran `python --version` in a PowerShell window that was already open, and PowerShell cannot find `python`. What do you try first?

## --options--

- [x] Close the terminal, open a new one and run the command again.
  > Yes. A terminal reads the PATH when it opens, so a window that was open during the install does not know about Python.
- [ ] Install VS Code again.
  > No. VS Code is a different tool. It does not add Python to your terminal.
- [ ] Type the command in capital letters.
  > No. Capital letters change nothing here. The open window still has the old PATH.
- [ ] Install Git.
  > No. Git is a separate tool and does not help Python be found.

## --why--

After any install, close the terminal and open a new one before you test. If a new terminal still cannot find Python, the PATH box was not ticked.

# --screen-- concept

**Windows:** download Git from git-scm.com, run the installer and press Next to keep the defaults. **Mac:** type `git --version` in Terminal. If macOS offers to install developer tools, press Install.

# --screen-- concept

Close and reopen your terminal, then run these three commands one at a time. Each prints a version. On Windows, if `python` is not found, try `py --version`. On a Mac, use `python3 --version`.

## --code--

```bash
python --version
git --version
code --version
```

# --screen-- checklist

## --items--

- Run the command below and paste what it prints.
  - command: `code --version`
  - pattern: `^\d+\.\d+\.\d+`
  - hint: The first line should be a version such as 1.95.3. If the terminal cannot find `code`, close and reopen it. On a Mac, open VS Code, press Cmd+Shift+P, type `shell command` and choose Install code command in PATH.
- Run the command below and paste what it prints.
  - command: `python --version`
  - pattern: `^Python 3\.(1[2-9]|[2-9]\d)\b`
  - hint: The output should read Python 3.12 or higher. If your Python is older, install a newer one from python.org. If the terminal cannot find it, try `py --version` on Windows or `python3 --version` on a Mac, then check that you ticked Add python.exe to PATH.
- Run the command below and paste what it prints.
  - command: `git --version`
  - pattern: `^git version \d+\.\d+`
  - hint: The output should look like git version 2.45.1. If the terminal cannot find Git, close and reopen it. If it still fails, run the Git installer again.

# --screen-- concept

In VS Code, choose File, then Open Folder, and pick a folder. Open the built-in terminal with `` Ctrl+` `` (the key under Esc). It starts inside the folder you opened.

## --callout-- info

PostgreSQL, the database, is also on your tool list. You install it later, in chapter B7.

# --screen-- mcq

## --question--

What does Live Server do?

## --options--

- [x] It opens your page in the browser and refreshes it when you save.
  > Yes. You see each change as soon as you save the file.
- [ ] It puts your site on the internet.
  > No. Live Server runs only on your laptop. Nobody else can open the address it gives you.
- [ ] It runs your Python code.
  > No. Python runs Python code. Live Server is for HTML pages.
- [ ] It saves versions of your code.
  > No. Git does that. Live Server only shows your page.

## --why--

Live Server saves you from pressing refresh. It is for checking your pages while you build them.

# --screen-- checklist

## --items--

- In VS Code, install the **Python** (Microsoft) and **Live Server** extensions from the Extensions tab.
- Open the `practice` folder you made in the last lesson (File, Open Folder). Inside `frontend`, make a file called `index.html`. Open the workshop Build a Student Profile Page, copy your code from its editor, and paste it into the file. Save it.
- Right-click `index.html` in VS Code and choose Open with Live Server. Your page opens in the browser, at an address that starts with `127.0.0.1`. Change a word, save, and watch the page refresh.
