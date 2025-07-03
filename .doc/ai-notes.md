# AI Notes & Conventions

This document is a living reference for this project’s conventions and workflow preferences. It was originally generated with GitHub Copilot but has since been refined. All manual edits take precedence.

## Message to AI
- Treat all manual edits and manually created files as **canonical**. Never modify or override them without explicit instruction.
- Favor **simplicity and minimalism**. Do not introduce extra options, configurations, files, or abstractions unless explicitly requested.
- Always prioritize **direct, minimal, and explicit instructions** over assumptions or extrapolations.
- Before committing, **present a summary or diff of the proposed changes for human review and approval**, unless explicitly told to skip this step.

## Commit Message Conventions
- **Always use [Conventional Commits](https://www.conventionalcommits.org/) format.** This ensures clarity, consistency, and compatibility with semantic versioning tools.
- Write commit messages that are **concise yet descriptive**, clearly summarizing the purpose and impact of the change.
- For multi-item commits, **use bullet points** to list key changes for better readability.
- If a commit fails due to linting, tests, or other checks, **reuse the original commit message** when fixing and recommitting. Do not create redundant commit histories.

## File Naming Conventions
- Always use **kebab-case** for filenames, including TypeScript files.  
  ✅ `attractor-store.ts`  
  ❌ `AttractorStore.ts`
- Apply kebab-case consistently for all new files.
- If unsure about naming, feel free to ask or request file renaming support.
- _(It kinda feels rebellious if you think about it.)_  
  (Typo preserved by design.)