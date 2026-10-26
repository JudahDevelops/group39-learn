# --screen-- concept

**Git** keeps save points, called **commits**, for a whole folder. You can see what changed and when, and go back if something breaks. **GitHub** keeps a copy of your repository online, so the group can share code.

# --screen-- mcq

## --question--

What does a commit do?

## --options--

- [x] It saves a snapshot of your changes with a message.
  > Yes. A commit is a save point on your laptop, with a message that says what changed.
- [ ] It uploads your code to GitHub.
  > No. That is `git push`. A commit stays on your laptop until you push it.
- [ ] It installs the libraries your project needs.
  > No. That is `pip install`. Git does not install anything.
- [ ] It runs your tests.
  > No. pytest runs tests. A commit only records your files.

## --why--

A commit saves. A push sends. You can commit many times, then push them all together.

# --screen-- concept

You will repeat the same five commands again and again.

| Command | Does |
|---|---|
| `git status` | Shows what changed since the last commit |
| `git add .` | Stages all changes for the next commit |
| `git commit -m "Add intro"` | Saves a commit with a message |
| `git push` | Sends your commits to GitHub |
| `git pull` | Gets other people's commits |

# --screen-- order

## --prompt--

Put the everyday loop in order.

## --items--

- Change a file and save it
- `git status` to see what changed
- `git add .` to stage the changes
- `git commit -m "Describe the change"` to save them
- `git push` to send them to GitHub

## --why--

You add first, so Git knows which changes belong in the commit. You push last, once the commit exists.

# --screen-- concept

Tell Git who you are, once per laptop. Use your own name and the email address of your GitHub account. Git puts both on every commit.

## --code--

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

# --screen-- checklist

## --items--

- Create a GitHub account at github.com if you do not have one. Choose a username you are happy to show in public. Never share your password with anyone, including this platform.
- In this platform, click your name in the top bar to open Your profile. Type your GitHub username in the GitHub username box and press Save changes. The platform uses it to find your projects.
- Run the two `git config` commands above with your own details. Then run the command below and paste what it prints.
  - command: `git config --global user.name`
  - pattern: `^(?!Your Name\s*$)\S`
  - hint: Your own name should print. If nothing prints, run `git config --global user.name "Your Name"` again with your name inside the quotes. If it prints Your Name, replace it with your real name.

# --screen-- concept

Normally you start a repository with `git init`. Your group made a **template** instead, so you skip that step. Open github.com/JudahDevelops/group39-ihms and sign in. Press **Use this template**, then **Create a new repository**. Name it `my-ihms`, choose **Public**, and press **Create repository**.

## --callout-- info

Leave "Include all branches" off. Your copy starts with the same folders and files as the template.

# --screen-- mcq

## --question--

Why must your repository be Public?

## --options--

- [x] The platform reads your repository without signing in, and it cannot see a private one.
  > Yes. For a private repository, GitHub tells the platform it cannot be found, so your project cannot pass.
- [ ] GitHub only runs checks on public repositories.
  > No. GitHub can run checks on private repositories too. The platform is what cannot see them.
- [ ] Public repositories are faster.
  > No. Speed is the same. Only who can see the repository changes.
- [ ] So that other members can edit your code.
  > No. Public means anyone can read it. Only you can change it.

## --why--

Public means anyone can read your repository, so never put passwords or keys in it.

# --screen-- concept

**Cloning** copies your repository from GitHub to your laptop. On your repository's page, press the green **Code** button, choose HTTPS, and copy the address. In the terminal, go to Documents and run this command. Then `cd my-ihms`.

## --code--

```bash
git clone <your repo url> my-ihms
```

# --screen-- concept

Write the code yourself. AI may explain code to you, but it must not write it. Every member must be able to explain every line they push.

## --callout-- warning

Never commit passwords or keys. The file `.gitignore` lists what Git skips. In your repository it already lists the three lines below. Passwords and keys will go in `.env`.

## --code--

```text
.venv/
__pycache__/
.env
```

# --screen-- spotbug

## --code--

```text
.venv/
__pycache__/
env
```

## --question--

A member's secrets file is called `.env`, but `git status` lists it as a new file to commit. What is wrong with this `.gitignore`?

## --options--

- [x] The last line is `env`, not `.env`, so it does not match the file.
  > Yes. Each line must match the file name exactly, including the dot at the start.
- [ ] `.gitignore` can hold only two lines.
  > No. It can hold as many lines as you like.
- [ ] `.venv/` should not end with a slash.
  > No. The slash marks a folder, which is what `.venv` is.
- [ ] Each line needs a comma at the end.
  > No. One file name or pattern goes on each line, with no commas.

## --why--

Git ignores a file only when a line matches its name. Check that a secret file no longer shows up in `git status`.

# --screen-- checklist

## --items--

- Clone your repository into Documents and go inside `my-ihms`. Run the command below and paste what it prints.
  - command: `git remote -v`
  - pattern: `origin\s+https://github\.com/\S+\s+\(fetch\)`
  - hint: It should list `origin` with your `https://github.com/` address. If it says `fatal: not a git repository`, you are not inside `my-ihms`. Run `cd my-ihms`.
- Open `README.md` in VS Code. Add one line of your own at the bottom, saying what this copy is. Save the file.
- Run `git status`, then `git add .`, then `git commit -m "Add a line to the README"`, then `git push`. If a window asks you to sign in to GitHub, sign in through the browser it opens. If the terminal asks for a password, stop and ask the group.
- Run the command below and paste what it prints.
  - command: `git status`
  - pattern: `^(?=[\s\S]*up to date with .origin/main.)(?=[\s\S]*nothing to commit)`
  - hint: You should see that your branch is up to date with origin/main and that there is nothing to commit. If it says your branch is ahead, run `git push`. If it lists changed files, run `git add .` and commit them first.
- Open your repository page on GitHub and refresh it. You see your commit message and your files. The folder `.venv` is not in the list.

# --screen-- concept

Every push to `main` starts a run of the `labs` workflow on GitHub. Open the **Actions** tab on your repository's page, then the latest run. It lists ten jobs, named `lab-setup`, `lab-db` and so on. A green tick means a job passed. A red cross means it failed.

# --screen-- mcq

## --question--

After your first push, the jobs `lab-setup` and `lab-db` are both red. What do you do about `lab-db` now?

## --options--

- [x] Nothing yet. `lab-db` belongs to a later project.
  > Yes. Each job checks one project. The platform only looks at the job for the project you are working on.
- [ ] Edit the files in `tests/official` until it passes.
  > No. GitHub replaces those files with fresh official copies on every run, so your edits change nothing.
- [ ] Delete the workflow file.
  > No. The workflow is what runs the checks for every project.
- [ ] Make the repository private.
  > No. The platform could then no longer read your results.

## --why--

All ten jobs run on every push. Most stay red until you reach their chapters, and that is normal.

# --screen-- checklist

## --items--

- Open the Actions tab of your repository. Find the run for your push and wait until it has stopped spinning.
- Click the job `lab-setup`, then open the step **Run lab-setup**. The job is red for now, because your chapter B4 functions are not in the repository yet. Find a line that ends with `Paste your chapter B4 function`.
