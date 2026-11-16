# Agent instructions

## Branches
- Name branches `feature/<slug>`, where `<slug>` is a short, lowercase, hyphen-separated description of the change, e.g. `feature/release-workflow` or `feature/fix-tail-mode-crash`.

## Git commits
- Commits must be authored by the human user, never by an AI or bot identity (e.g. "Claude", "Copilot", `noreply@anthropic.com`).
- Pick the author identity in this order:
  1. `git config user.name` and `git config user.email`, if they're set and aren't a bot identity.
  2. Otherwise (e.g. in a cloud agent session), the GitHub user the session is logged in as: get `login`, `id` and `name` from `gh api user`, and commit with `--author="<name or login> <<id>+<login>@users.noreply.github.com>"`.
  3. If neither is available, don't commit. Ask the user which name and email to use.

## Commit messages and pull request descriptions
- Never hard-wrap lines in commit messages or PR descriptions. Write each paragraph, bullet or sentence on one line, however long, and let the tool that displays the text wrap it.
- Only use line breaks where they carry meaning: between the subject and the body, between paragraphs, and between list items or other Markdown blocks.

## Changelog
- When you implement a feature, fix or other user-visible change, add an entry to `CHANGELOG.md` under a `### Unreleased` heading at the top of the list, just below `# Change Log`. Create the heading if it doesn't exist.
- Follow the existing style: one `* ` bullet per change, separated by blank lines, written for users of the extension, and ending with `Fixes #123.` or `Related to #123.` when there's an issue.
- Don't rename `Unreleased` to a version number; that happens when a release is made.
