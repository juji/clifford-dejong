# AI Notes & Conventions

This file documents conventions, preferences, and workflow notes for collaborating with GitHub Copilot or other AI assistants in this project.

## Commit Message Conventions
- Use `(m)` in commit messages to indicate a manual edit. Example:
  - `fix(component): update logic for edge case (m)`
- Do not include extra explanations about manual edits in the commit message unless specifically requested.
- Treat all manual edits and creations as canonical. Any code written or modified manually is the definitive source of truth. Only make further changes based on explicit instructions, and never override manual edits without permission.

## File naming conventions
- Always use kebab-case for filenames, even when the file is a TypeScript file. This is a common convention in web development and helps maintain consistency across your project. For example, instead of naming a file `AttractorStore.ts`, you would name it `attractor-store.ts`. This applies to all files, including those that contain TypeScript code.
- If you have a file that is currently named `AttractorStore.ts`, please rename it to `attractor-store.ts`. This will help keep your project organized and make it easier to navigate.
- If you need to create a new file, use kebab-case for the filename as well.
- For example, if you are creating a new file for a Zustand store, you might name it `attractor-store.ts`. If you are creating a new file for a worker, you might name it `mock-worker.ts`.
- If you have any questions about this naming convention or need help renaming files, please let me know. I can assist you with the renaming process or provide guidance on how to implement this convention in your project.
- it kinda feel rebelious if you think about it. (not gonna change the typo error)

## Workflow Tips
- If you want the AI to follow a specific convention, add it here and reference this file at the start of a session.
- For persistent preferences, update this file as needed.

---
_Last updated: 2025-07-01_
