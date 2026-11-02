# Claude Integration Lab

My journey from beginner to advanced Claude integrations.

This repo is a learning notebook. Each numbered folder is one topic, in the order I plan to learn them. Every folder has its own `README.md` with a plain-language explanation.

## Folder structure

```
claude-integration-lab/
├── 01-apis/                  ← Talk to Claude from code
├── 02-mcp-servers/           ← Give Claude new tools
├── 03-claude-code-skills/    ← Teach Claude Code how to do tasks your way
├── 04-github-integrations/   ← Use Claude with GitHub
└── 05-ai-agents/             ← Let Claude take steps on its own toward a goal
```

## The topics in simple words

### 1. APIs: talk to Claude from code
An API is a doorway that lets one program talk to another. With the Claude API, a script you write can send Claude a question and get an answer back. This is the foundation for everything else.

### 2. MCP servers: give Claude new tools
MCP (Model Context Protocol) is a standard way to plug tools and data into Claude. An MCP server is a small program that says "here are things I can do," such as read a file or look up the weather, and Claude can then use them. Think of them as apps you install for Claude.

### 3. Claude Code skills: teach Claude your way of working
Claude Code is Claude as a coding helper in the terminal. A skill is a folder with a `SKILL.md` file of instructions that teaches Claude Code a specific task. Think of it as a recipe card.

### 4. GitHub integrations: Claude where your code lives
GitHub stores code and tracks changes. Integrations let Claude help there: reviewing pull requests, replying to issues, or running as an automated job with GitHub Actions.

### 5. AI agents: Claude that takes action
An agent is Claude working in a loop: plan a step, use a tool, check the result, repeat until the goal is done. Agents combine all the earlier topics.

## Why this order?
Each topic builds on the one before it:
**APIs** (the basics) → **MCP** (tools) → **Skills** (instructions) → **GitHub** (real workflows) → **Agents** (all of it together).

## Current status
- [ ] 01 – APIs
- [ ] 02 – MCP servers
- [ ] 03 – Claude Code skills
- [ ] 04 – GitHub integrations
- [ ] 05 – AI agents

No packages are installed and no paid APIs are used yet.
