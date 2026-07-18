# Build a True Agent Society Platform

You are a Senior AI Architect and Full Stack Engineer.

Build a production-ready **Agent Society** platform.

The goal is to build a real multi-agent system, not multiple prompts pretending to be different agents.

---

# Core Concept

There is one **Orchestrator Agent**.

The Orchestrator is responsible for:

* Understanding the user's request
* Maintaining global conversation context
* Discovering available agents
* Selecting the best agents
* Coordinating execution
* Collecting responses
* Returning the final collaborative answer

The Orchestrator is **not** a domain expert.

---

# Dynamic User-Created Agents

Users can create unlimited custom AI agents.

There must be **no predefined agents**.

Each agent is created by the user and stored in the database.

Each agent has its own independent identity.

Every agent stores:

* id
* name
* description
* personality
* role
* expertise
* capabilities
* system prompt
* AI provider
* model
* temperature
* max tokens
* enabled status

Each agent behaves independently.

---

# Independent Agent State

Each agent must maintain its own state.

Every agent has:

* its own system prompt
* its own conversation history
* its own execution history
* its own memory
* its own configuration

Agents must not share their private memory.

Only the Orchestrator maintains the global conversation.

---

# Agent Discovery

The Orchestrator must never know agent names.

Instead it should dynamically discover agents by querying the database.

For every request:

1. Load all enabled agents.
2. Compare the user's request with each agent's expertise and capabilities.
3. Select the most relevant agents.
4. Build an execution plan.

Agent selection must be dynamic.

No hardcoded routing.

---

# Agent Execution

Each selected agent executes independently.

Each execution receives:

* User request
* Global conversation context
* Previous agent outputs (if available)
* Agent's own memory
* Agent's own system prompt

Each agent returns:

* analysis
* reasoning
* recommendations
* confidence score
* optional follow-up questions

The Orchestrator combines these into the final response.

---

# Direct Agent Mention

Users can explicitly invoke an agent.

Example:

@ProgrammingAgent

@FinanceAgent

If an agent is mentioned, execute that agent directly.

The Orchestrator may still involve additional agents if necessary.

---

# Multi-Agent Collaboration

Support:

Sequential execution

Orchestrator
↓

Research Agent
↓

Programming Agent
↓

Security Agent
↓

Orchestrator

and

Parallel execution

Research Agent

*

Programming Agent

*

Finance Agent

↓

Orchestrator

The execution strategy should be configurable.

---

# Agent Communication

Agents never call each other directly.

Instead:

Agent A

↓

Orchestrator

↓

Agent B

The Orchestrator manages all communication.

---

# Architecture

Separate the project into modules:

* Authentication
* Agent Builder
* Society Builder
* Execution Engine
* Agent Discovery
* AI Provider Layer
* Memory Layer
* Conversation Layer

Use clean architecture principles.

---

# AI Layer

Support multiple providers.

Each agent chooses its own provider.

Examples:

* OpenAI
* Google Gemini

Adding another provider should require minimal changes.

---

# Extensibility

The platform must support:

Unlimited users

Unlimited societies

Unlimited agents

Unlimited workflows

No code changes should be required when users create new agents.

Everything must be database-driven.

---

# Goal

Build a scalable, production-ready Agent Society where independently configured AI agents collaborate under an Orchestrator, maintaining separate identities and state while working together inside one shared conversation.

Implement the project step by step, beginning with the architecture, database schema, folder structure, and execution engine before building the user interface.