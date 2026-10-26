# --screen-- concept

Code lives in **plain text files**. A Word document adds hidden formatting, so a computer cannot run it as code. The **extension**, the ending of the file name, says what is inside.

| Extension | What is inside |
|---|---|
| `.html` | A web page |
| `.css` | How a page looks |
| `.js` | JavaScript |
| `.py` | Python |
| `.sql` | Database commands |

# --screen-- mcq

## --question--

Why should you not write code in Word?

## --options--

- [x] Word adds hidden formatting, and code must be plain text.
  > Yes. A computer reads every character in a code file, so hidden formatting breaks it.
- [ ] Word is too slow to open code files.
  > No. Speed is not the reason. The file itself would hold extra hidden data.
- [ ] Word cannot save a file ending in `.py`.
  > No. Word can save almost any name. The problem is what it writes inside the file.
- [ ] Code needs a coloured background.
  > No. Colour is only decoration in an editor. It is not stored in the file.

## --why--

A code file is only the characters you typed. Word adds fonts, sizes and styles that Python, a browser or a database cannot read.

# --screen-- match

## --prompt--

Match each file name to the job its extension tells you it does.

## --pairs--

- `index.html`
  - A page the browser opens
- `styles.css`
  - The colours and layout of a page
- `main.py`
  - Python code that the server runs
- `schema.sql`
  - Commands for the database

## --why--

The extension tells you what is inside before you open the file.

# --screen-- concept

A **path** is a file's address: every folder you pass through, then the file name. Windows separates the parts with `\`. A Mac uses `/`.

## --code--

```text
C:\Users\Amina\Documents\practice\frontend\index.html
/Users/amina/Documents/practice/frontend/index.html
```

# --screen-- mcq

## --question--

In `C:\Users\Amina\Documents\practice\frontend\index.html`, which folder holds the file `index.html`?

## --options--

- [x] `frontend`
  > Yes. The folder just before the file name is the one that holds it.
- [ ] `practice`
  > No. `practice` holds the `frontend` folder, and `frontend` holds the file.
- [ ] `Documents`
  > No. `Documents` is two folders further out.
- [ ] `Users`
  > No. `Users` is the folder that holds one folder for each person on the laptop.

## --why--

Read a path from left to right: each part is inside the one before it. The last part is the file.

# --screen-- concept

The **terminal** lets you control your computer by typing. On Windows, press the Windows key, type `PowerShell` and press Enter. On a Mac, press Cmd+Space, type `Terminal` and press Return. What you type is a **command**.

## --callout-- info

Windows also has Command Prompt. This chapter uses PowerShell, and says when to switch.

# --screen-- concept

Five commands move you around.

| Command | Does |
|---|---|
| `pwd` | Shows which folder you are in |
| `ls` | Lists what is in the folder |
| `cd practice` | Moves into a folder |
| `cd ..` | Moves up one folder |
| `mkdir backend` | Makes a folder |

## --callout-- tip

Press Tab to finish a file or folder name. Press the Up arrow to repeat a command.

# --screen-- match

## --prompt--

Match each job to the command that does it.

## --pairs--

- See which folder you are in
  - `pwd`
- Go up one folder
  - `cd ..`
- Make a folder called `backend`
  - `mkdir backend`
- See what is in the folder
  - `ls`

## --why--

`pwd` and `ls` only look. `cd` and `mkdir` change something: where you are, or what exists.

# --screen-- predict

## --code--

```text
> pwd
C:\Users\Amina\Documents
> cd practice
> cd backend
> cd ..
> pwd
```

## --question--

You type the lines that start with `>`. The terminal prints the other line. What does the last `pwd` show?

## --options--

- [x] `C:\Users\Amina\Documents\practice`
  > Yes. `cd backend` went in, and `cd ..` came back out to `practice`.
- [ ] `C:\Users\Amina\Documents\practice\backend`
  > No. That is where you were before `cd ..`. This command moved you up one folder.
- [ ] `C:\Users\Amina\Documents`
  > No. `cd ..` moves up only one folder, from `backend` to `practice`.
- [ ] `C:\Users\Amina`
  > No. Nothing in these lines went that far out.

## --why--

Follow the folder one command at a time: Documents, practice, backend, then back up to practice.

# --screen-- spotbug

## --code--

```text
> cd practice
> mkdir backend
> cd frontend
```

## --question--

The last command fails. The terminal says it cannot find `frontend`. What is wrong?

## --options--

- [x] Only `backend` was made. The folder `frontend` does not exist yet.
  > Yes. `cd` can only move into a folder that exists, so make it first with `mkdir frontend`.
- [ ] `cd` cannot move into a folder on the same day it was made.
  > No. A folder works the moment `mkdir` makes it.
- [ ] The command needs `..` first.
  > No. You are already in `practice`, which is where `frontend` should be.
- [ ] Folder names must start with a capital letter.
  > No. The spelling of the name is fine. The folder is missing.

## --why--

When `cd` says it cannot find a folder, run `ls` and look at what is really there.

# --screen-- mcq

## --question--

Which command moves you into a folder?

## --options--

- [x] `cd`
  > Yes. `cd` means change directory, and a directory is a folder.
- [ ] `ls`
  > No. `ls` lists what is in the folder you are already in.
- [ ] `mkdir`
  > No. `mkdir` makes a new folder but does not move you into it.
- [ ] `pwd`
  > No. `pwd` only shows where you are.

## --why--

`cd` is the command that changes where you are. The others show or make things.

# --screen-- checklist

## --items--

- Open PowerShell (Windows) or Terminal (Mac) and go to your Documents folder with `cd ~/Documents`. Run the command below and paste what it shows.
  - command: `pwd`
  - pattern: `Documents`
  - hint: The path should end with `Documents`. If the terminal cannot find the path, your Documents folder may be inside OneDrive. Try `cd ~/OneDrive/Documents`.
- Using only the terminal, make a folder called `practice` in Documents, and inside it the folders `frontend` and `backend`. This folder is for practice in this chapter. Your real project comes in the lesson Git and GitHub. Go into `practice`, run the command below and paste what it shows.
  - command: `ls`
  - pattern: `^(?=[\s\S]*\bbackend\b)(?=[\s\S]*\bfrontend\b)`
  - hint: You should see both `backend` and `frontend`. If one is missing, make it with `mkdir`. If you see other files, run `pwd` to check which folder you are in.
