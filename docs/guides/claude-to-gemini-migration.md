# Migrating from Claude Code to Antigravity & Gemini CLI
**A Comparative Analysis & Capability Guide**

> [!NOTE]
> This guide addresses the transition from a process-based Claude Code agent architecture to the persona-based Antigravity/Gemini CLI ecosystem.

## 1. Conceptual Mapping

The fundamental shift is from **Autonomous Processes** (Claude) to **Knowledge Personas** (Gemini/Antigravity).

| Feature | Claude Code (CC) | Antigravity / Gemini CLI |
| :--- | :--- | :--- |
| **Agent Definition** | `.claude/agents/*.json` or `.md` | `.gemini/knowledge/*.md` |
| **Execution Model** | **Multi-Process**: CC spins up separate OS processes for each agent. | **Single-Process / Persona Adoption**: One agent "adopts" multiple personas serially. |
| **Context Access** | Independent context per process. | Shared global context (Knowledge Graph). |
| **Skills** | `.claude/skills/` | `.agent/skills/` (Symlinked to `.gemini/skills/`) |
| **Coordination** | Inter-process communication (IPC) or Supervisor. | Internal "Context Switching" / Task Boundaries. |
| **Activation** | Configuration-driven / Auto-spawn. | **Pull-based**: Agent discovers KIs via `knowledge_discovery`. |

## 2. The "Subagent" Paradigm Shift

In Claude Code, you might see logs indicating a "React Specialist" has started as a background process. In Antigravity, **I become the React Specialist**.

### How it works in Antigravity:
1.  **Discovery**: I check `.gemini/knowledge` (or legacy `.claude/agents`) and see `react-specialist.md`.
2.  **Adoption**: I read the file. I am no longer just "Antigravity"—I am now "Antigravity acting as React Specialist".
3.  **Application**: I apply the constraints (e.g., "Must use Next.js 15") to the task.
4.  **Context Switch**: I then read `nexus-specialist.md`, drop the React constraints (temporarily), and apply Nexus constraints.
5.  **Synthesis**: I merge these perspectives into the final plan.

**Pros**:
-   **Coherence**: No "lost in translation" between processes. One brain synthesizes all constraints.
-   **Efficiency**: No overhead of spinning up multiple heavy LLM loops for simple checks.

**Cons**:
-   **Serial Execution**: I cannot literally write the Backend and Frontend code at the exact same second (parallelism).
-   **Cognitive Load**: I must manage the context of multiple specialists simultaneously.

## 3. Addressing Gaps & Shortcomings

### Gap 1: Parallel Execution
**Claude Code**: Can spawn 3 terminals: one installing npm packages, one running migrations, one creating files.
**Gemini CLI**: Typically serial.
**Remediation**: Use **Workflows** (`.agent/workflows`).
-   Instead of spawning 3 agents, create a `setup_project.md` workflow.
-   Use `// turbo-all` to execute blocking commands in sequence but rapidly.
-   *Missed Opportunity*: We could have defined a `workflow_parallel_setup.md` that explicitly instructs the opening of multiple terminals (via `run_command` backgrounding) to simulate parallelism.

### Gap 2: Explicit Handoffs
**Claude Code**: Agent A explicitly "hands off" to Agent B.
**Gemini CLI**: Handoff is implicit.
**Remediation**: Use **Task Boundaries**.
-   Task 1: "Acting as React Specialist" (Status: Designing Frontend)
-   Task 2: "Acting as Nexus Specialist" (Status: Designing Backend)
-   *Shortcoming*: If the user doesn't see the internal thought process, it looks like one generic agent. We must be verbose in `agent_reviews.md` artifacts to prove the persona adoption occurred.

### Gap 3: Tool/Skill Isolation
**Claude Code**: Backend Agent has `kubectl`; Frontend Agent does not.
**Gemini CLI**: I have all tools.
**Remediation**: Discipline.
-   I must self-regulate: "I am acting as Frontend, so I should not touch `src/app.py`".
-   *Risk*: Accidental cross-domain pollution (e.g., importing a React util in Python) is higher because the toolset is shared.

## 4. Migration Strategy for Users

To replicate Claude Code capabilities 100%:

1.  **Migrate Agents to Knowledge Items**:
    -   Move `.claude/agents/*.md` to `.gemini/knowledge/`.
    -   Ensure they have concise `metadata.json` or YAML frontmatter so the `knowledge_discovery` tool finds them.

2.  **Codify Coordination in Workflows**:
    -   Don't rely on "magic" coordination.
    -   Create `.agent/workflows/review_architecture.md`:
        ```markdown
        1. Read `react-specialist` knowledge.
        2. Review `apps/web` against constraints.
        3. Read `nexus-specialist` knowledge.
        4. Review `src/` against constraints.
        5. Generate `docs/architecture_review.md`.
        ```

3.  **Leverage User Rules (`GEMINI.md`)**:
    -   Use the `GEMINI.md` to force the check of specific specialists before major tasks (e.g., "Before any DB change, consult `dataflow-specialist`").

## 5. Summary

Antigravity replicates the *intelligence* of multi-agent systems through **Persona Adoption**, but it replaces the *process architecture* with a **Unified Context**. For most coding tasks, this Unified Context is actually superior because it prevents integration drift, though it sacrifices the raw speed of parallel execution.
