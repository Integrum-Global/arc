# Setup
1. We are going to implement this project using 3 parallel processes (worktrees created from main
  branch). Please create the following: 
     - Backend worktree (local: arc-backend, sync to backend branch)
     - Web worktree - React (local: arc-web, sync to web branch)
     - Mobile worktree - Flutter for iOS and Android (local: arc-mobile, sync to the mobile branch)
2. Branch setup
   - Staging branch
   - Production branch (protected)

# Tasks
## From plans to todos
1. Referencing your plans in docs/02-plans
   - Review and update/create detailed implementation and integration plans:
     - Given 3 parallel worktrees:
       - Backend worktree (local: arc-backend, sync to backend branch)
       - Web worktree - React (local: arc-web, sync to web branch)
       - Mobile worktree - Flutter for iOS and Android (local: arc-mobile, sync to the mobile branch)
     - Work with subagents (especially the framework specialists: kailash, kaizen, dataflow, nexus), following our procedural directives, and revise the plans accordingly.
       - Please consider where should the gateway (nexus) codebase be located.
     - Use the subagents in .claude/agents/frontend to review your implementation plans and todos for the frontends.
        - Ensure that you are using a consistent set of design principles for all our FE interfaces.
        - Ensure that you are using the latest modern UI/UX principles/components/widgets in your implementation.
        - Document the details into docs/03-design, using as many files as required and naming them in sequence 01-, 02-, etc.
   - make any necessary revisions to the organization of the codebase.
     - All backend codes should be in src/...
     - All web (react) codes should be in apps/web
     - All mobile (flutter) codes should be in apps/mobile
2. After that, work with todo-manager, following our procedural directives, and create detailed todos for EVERY todo/task required.
   - The detailed todos should be created in todos/active.
   - Review after you are done to ensure that you leave no gaps behind.
3. Do not continue until I have approved your todos.

## Instructions for each worktree
1. Write the detailed instructions for each worktree. We are using CodeGen (Claude Code) to implement the codebase.
2. The instructions should be:
   - Independent to each worktree with the detailed referencing to the detailed todos.
   - Integration between the worktrees
3. Note that I will be pasting each instruction to a fresh terminal for each worktree accordingly.
4. Put these instructions into docs/04-instructions, naming them sequentially as 01-, 02-, for easy referencing. 

## Ensure instructions are synced to all worktrees.
1. Stage all files, commit, and push. 
2. Ensure that all worktrees are on the same commit.
