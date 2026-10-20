# Agent Interaction Guidelines

## 1. Code Verification & Fact Checking (No Hallucinations)
* **Always Check Code Before Answering**: Always read the relevant files, source code, `.env`, database records, and configurations before making any claims or explanations.
* **Zero Guesswork / Zero Hallucination**: Never guess, assume, or fabricate gateways (e.g. citing Pesapal or PayPal when `.env` uses IntaSend), credentials, pricing tiers, or database contents.
* **Strict Scientific Integrity (Zero Synthetic/Mock Data in DB)**: NEVER insert mock, placeholder, synthetic, or randomly matched data into the database (e.g. creating fake citation links or linking unrelated papers to fulfill foreign key constraints). All citations, metrics, counts, and ledger records must originate from genuine, verifiable external sources (OpenAlex, Crossref, etc.) with real titles, DOIs, and venues. If real data is missing or incomplete, leave it null/zero or explicitly report it as unavailable rather than fabricating records.
* **Inspect the Single Source of Truth**: When the user asks how something works or why something behaves a certain way, inspect the actual implementation in the codebase first.

## 2. Plan First / "Acknowledge First, Don't Code"
* **Discussion & Planning**: Always provide an implementation plan or clear discussion before writing or modifying code.
* **Questions vs Implementation**: Differentiate strictly between exploratory/hypothetical questions and implementation requests. Never jump into coding when exploring ideas, asking questions, or discussing design.
* **Explicit Instruction Only**: Only start coding when explicitly instructed (e.g., "proceed", "code it", "do it").
* **Plan Adherence**: Follow approved plans accurately without unilaterally dropping features or making arbitrary changes.

## 3. Clean Design & No AI Cliches
* **No AI Cliches**: Do not use cheesy AI badges, sparkle emojis, generic gradient borders, or "Powered by AI" labels.
* **Natural Terminology**: Use clean, standard terminology (e.g., use "Transcription" instead of "AI Transcription", "General Chat" instead of "AI Lounge").
* **Clean Navigation & Labels**: Avoid ambiguous slashes in navigation links, titles, and tabs (e.g., use "Teachers Forum" instead of "Teachers Forum / Community").

## 4. Git & Version Control Policy
* **Never Execute `git commit` Directly**: Never run the `git commit` command for the user.
* **Commit Preparation Only**: When the user indicates they want to commit:
  1. Inspect and ensure `.gitignore` is properly configured (exclude untracked temp files, cache, or private documents).
  2. Stage appropriate project files if needed (`git add`).
  3. Provide a clear, conventional commit message for the user to copy/paste and execute themselves in the terminal.

## 5. Deployment Context (Active Live Production Site)
* **The Site Is Already Live in Production**: This is not a new or initial setup. When the user mentions "pushing", "uploading", or "zipping for cPanel", it means **incremental updates/propagation** of the modified changes to an already running production site.
* **No Beginner Setup Tutorials**: Never give basic "how to set up cPanel for the first time" tutorials, database creation walk-throughs, or novice onboarding instructions. Focus strictly on the exact diffs, build output, updated files, or specific migration scripts needed to propagate the latest changes.
