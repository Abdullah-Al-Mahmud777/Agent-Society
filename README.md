# Agent Society

A multi-agent AI system that allows users to create, configure, and interact with specialized AI agents for different domains.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Society     │  │  Agent       │  │  Providers   │         │
│  │  Page        │  │  Builder     │  │  Page        │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS FRONTEND                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Components (Lucide Icons, Motion Animations)     │   │
│  │  Zustand State Management                                 │   │
│  │  Session-aware ChatGPT-style workspace                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ /api/auth    │  │ /api/db      │  │ /api/        │         │
│  │ register/    │  │ agents/      │  │ providers    │         │
│  │ login/session│  │ conversations│  │ orchestrator │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐         │
│  │ Session +    │  │ User-scoped  │  │ Provider     │         │
│  │ rate limits  │  │ persistence  │  │ Management   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROVIDER FACTORY LAYER                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   LLMProviderFactory                                       │   │
│  │  - Client Creation (Gemini, OpenAI, Anthropic, Qwen)    │   │
│  │  - Fallback Models                                       │   │
│  │  - Retry Logic with Exponential Backoff                  │   │
│  │  - Error Handling (401, 429, 500)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LLM PROVIDERS                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Google      │  │  OpenAI      │  │  Anthropic   │         │
│  │  Gemini      │  │  GPT         │  │  Claude      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐                                                │
│  │  Qwen        │                                                │
│  │  (OpenRouter)│                                                │
│  └──────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture Components

### Frontend Layer
- **Auth Pages**: `/login` and `/register` with validation, rate-limit feedback, and dark/light themes
- **Society Page**: ChatGPT-style workspace with collapsible history, search, agent selection, conversation management, and responsive mobile drawer
- **Agent Builder**: UI for creating and configuring custom agents
- **Providers Page**: UI for managing LLM provider configurations
- **State Management**: Zustand for the in-session agent index, hydrated from Turso
- **Persistence**: Turso is the source of truth for users, sessions, agents, providers, conversations, messages, and memory; browser storage is not used for user data

### Auth and API Layer
- **Auth Routes**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- **User Settings Route**: `/api/user/settings` for theme and preferences
- **Database Routes**: `/api/db/agents`, `/api/db/conversations`, `/api/db/memories`, `/api/db/status`
- **Agent Chat Route**: `/api/agent-chat` - Handles chat requests with domain enforcement
- **Agent Execution Route**: `/api/agents/execute` - Executes agent tasks
- **Providers Route**: `/api/providers` - Manages encrypted provider configurations and testing
- **Orchestrator Route**: `/api/orchestrator/chat` - Runs the selected agents and persists the run

### Provider Factory Layer
- **Client Creation**: Dynamically creates LLM clients based on provider
- **Fallback Models**: Automatically switches models on errors
- **Retry Logic**: Exponential backoff for transient errors
- **Error Handling**: Graceful handling of API errors (401, 429, 500)

### LLM Providers
- **Google Gemini**: Primary provider with fallback models
- **OpenAI**: GPT models support
- **Anthropic**: Claude models support
- **Qwen**: Via OpenRouter integration

## Data Flow

```
User Input → Frontend → API Route → Provider Factory → LLM Provider → Response
    ↓              ↓           ↓              ↓              ↓
  Domain      System      Client        Fallback      Model
  Check       Prompt     Creation       Logic         Call
```

## Key Features

- **Secure Multi-User Auth**: Email/password accounts, scrypt password hashing, hashed session tokens, httpOnly cookies, CSRF-safe same-site cookies, and login/registration rate limits
- **Account Isolation**: Every agent, provider, conversation, message, and memory query is scoped to the signed-in user
- **ChatGPT-Style Workspace**: Collapsible sidebar, conversation history grouped by date, search, new chat, rename/delete dialogs, agent toggles, and mobile drawer
- **Dark and Light Mode**: Cookie-backed theme persisted per account
- **Domain Enforcement**: Agents only respond within their designated domains
- **Multi-Provider Support**: Switch between Gemini, OpenAI, Anthropic, Qwen
- **Fallback Models**: Automatic model switching on errors
- **Retry Logic**: Exponential backoff for transient errors
- **Encrypted Provider Keys**: AES-256-GCM encryption on the server; plaintext keys never reach the browser
- **Custom Agents**: Build specialized agents with specific domains

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure `.env.local`:
   ```
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-turso-token
   API_KEY_ENCRYPTION_SECRET=your-random-server-secret
   SESSION_TTL_DAYS=30
   ```
   Create a Turso token with `turso db tokens create <database-name>` and generate
   the encryption secret with `openssl rand -hex 32`.
4. Apply the database schema: `npm run db:migrate`
5. Verify the connection and CRUD operations: `npm run db:verify`
6. Run development server: `npm run dev`
7. Open `/register` to create the first account, then sign in at `/login`
8. Configure a provider at `/providers`
9. Create agents at `/builder`
10. Interact with the society at `/society`

The first registered account claims any legacy records previously stored under
the server-side `default-user` ID. Browser `localStorage` is intentionally not
used for agents, providers, conversations, or memory, so signing into another
account cannot expose the previous user's data.

## Tests

- `npm test` — run all unit tests
- `npm run test:auth` — password hashing, validation, and rate-limit tests
- `npm run test:ai` — provider retry and Gemini fallback tests
- `npm run lint` and `npm run build` — static checks and production build

## About the Project

### Inspiration

The Agent Society project was inspired by the growing need for specialized AI systems that can handle complex, multi-domain tasks. While general-purpose LLMs are powerful, they often lack domain-specific expertise and context. I envisioned a system where users could create specialized AI agents—each with unique expertise, personalities, and domains—that could collaborate to solve complex problems.

The concept draws from the idea of a "society of mind," where multiple specialized cognitive processes work together to produce intelligent behavior. By creating a platform for building and orchestrating such agents, I aimed to make multi-agent AI systems accessible to developers and users without requiring deep expertise in distributed systems or AI orchestration.

### What it does

Agent Society is a multi-agent AI system that allows users to:

- **Create Custom Agents**: Build specialized AI agents with unique expertise, personalities, and domains through an intuitive builder interface
- **Multi-Agent Orchestration**: Run multiple agents in parallel or sequentially to solve complex problems collaboratively
- **Domain Enforcement**: Ensure agents only respond within their designated domains for accurate, specialized responses
- **Provider Flexibility**: Switch between multiple LLM providers (OpenAI, Anthropic, Qwen via OpenRouter) with automatic fallback
- **Agent Memory**: Maintain conversation history and execution context for each agent
- **Interactive Society**: Chat with your agent society in real-time with a modern, responsive UI

### How we built it

The project was built in several phases:

**Phase 1: Core Architecture**
- Set up Next.js 16 project with TypeScript and Turbopack
- Designed the multi-layer architecture (Frontend → API → Provider Factory → LLM)
- Implemented the Zustand store for agent and provider state management with persistence
- Created the agent database with indexing for efficient queries

**Phase 2: Provider Factory**
- Built the `LLMProviderFactory` class to dynamically create LLM clients
- Implemented support for multiple providers: OpenAI, Anthropic, Qwen (via OpenRouter)
- Added retry logic with exponential backoff: $t_{wait} = t_{base} \times 2^{n-1}$ where $n$ is the retry attempt
- Implemented fallback model switching on errors

**Phase 3: Agent System**
- Created the agent builder UI with form validation
- Implemented agent discovery using relevance scoring:
  $$score = w_1 \cdot \text{keyword\_match} + w_2 \cdot \text{semantic\_similarity} + w_3 \cdot \text{domain\_match}$$
- Built the orchestrator for parallel and sequential agent execution
- Implemented agent memory system for conversation history

**Phase 4: User Interface**
- Built the Society page for agent interaction
- Created the Agent Builder for creating custom agents
- Implemented the Providers page for API key management
- Added responsive design with mobile support
- Integrated animations and transitions with Motion library

**Phase 5: API Routes**
- Built `/api/agent-chat` for single agent interactions
- Created `/api/orchestrator/chat` for multi-agent orchestration
- Implemented `/api/providers` for provider management and testing
- Added domain enforcement to ensure agents stay within their expertise

**Phase 6: Security & Encryption**
- Implemented API key encryption using AES-256-GCM
- Added environment variable support for production deployment
- Built secure storage for sensitive configurations

### Challenges we ran into

**1. Provider API Inconsistencies**
Different LLM providers have vastly different API structures. OpenAI uses a specific format, Anthropic has its own structure, and Qwen (via OpenRouter) adds another layer of complexity. I solved this by creating a unified interface through the Provider Factory pattern, normalizing all provider responses to a consistent format.

**2. State Persistence & Rehydration**
Managing complex state across page reloads was challenging. Zustand's persistence middleware helped, but I had to carefully handle rehydration timing to prevent race conditions. I implemented proper loading states and rehydration checks to ensure the UI only renders when state is ready.

**3. Agent Discovery Accuracy**
Initially, agent discovery was too simplistic—just matching keywords. I improved this by implementing a multi-factor scoring system considering keyword matches, semantic similarity, and domain expertise. The challenge was tuning the weights ($w_1, w_2, w_3$) to balance precision and recall.

**4. Error Handling in Distributed Systems**
When multiple agents fail in parallel execution, it's hard to provide meaningful error messages. I implemented comprehensive error tracking that captures which agent failed, why it failed, and provides partial results when possible. The debug logging system helped tremendously in troubleshooting production issues.

**5. API Key Security**
Storing API keys securely in a client-side application is inherently challenging. I implemented encryption for stored keys and added environment variable fallbacks for server-side deployment. The challenge was balancing security with usability—users needed to easily configure providers without compromising security.

**6. Performance Optimization**
Running multiple agents in parallel can be resource-intensive. I implemented request batching, response streaming where possible, and added caching for agent configurations. The exponential backoff retry logic also helped reduce unnecessary API calls during rate limit errors.

**7. Next.js 16 Compatibility**
Working with Next.js 16 (a relatively new version) presented challenges with Turbopack and the new app router. I had to adapt to the new patterns for server components, API routes, and static/dynamic rendering. The learning curve was steep but resulted in a more modern and performant application.

### Accomplishments that we're proud of

- **Unified Provider Interface**: Successfully abstracted multiple LLM providers into a consistent interface, making it easy to add new providers
- **Intelligent Agent Discovery**: Built a sophisticated scoring system that accurately matches user requests to the most relevant agents
- **Robust Error Handling**: Implemented comprehensive error tracking and retry logic that makes the system resilient to API failures
- **Modern Tech Stack**: Leveraged Next.js 16, Turbopack, Zustand, and Tailwind CSS to build a performant, modern application
- **Security First**: Implemented proper encryption for sensitive data while maintaining usability
- **Responsive Design**: Created a fully responsive UI that works seamlessly on desktop and mobile devices
- **Real-time Orchestration**: Built a system that can execute multiple agents in parallel and synthesize their responses coherently

### What we learned

Building this project was a tremendous learning experience across several domains:

**1. Multi-Agent Orchestration**
- Understanding agent discovery algorithms and relevance scoring
- Implementing parallel vs. sequential execution strategies
- Designing agent memory systems for context persistence
- Learning about agent-to-agent communication patterns

**2. Provider Abstraction**
- Creating a factory pattern for dynamic LLM client initialization
- Handling API differences between providers (OpenAI, Anthropic, Qwen, etc.)
- Implementing retry logic with exponential backoff
- Building fallback mechanisms for model failures

**3. State Management & Persistence**
- Using Zustand for complex state management with persistence middleware
- Implementing local storage encryption for API keys
- Designing database-like indexing for agent queries

**4. Next.js 16 & Modern Web Development**
- Working with Next.js 16's new features and Turbopack
- Building server components and API routes
- Implementing responsive UI with Tailwind CSS and shadcn/ui
- Adding animations with Motion library

**5. Error Handling & Debugging**
- Implementing comprehensive error boundaries
- Building debug logging systems for production troubleshooting
- Handling API rate limits (429), authentication failures (401), and server errors (500)

### What's next for Agent Society

- **Agent Collaboration**: Enable agents to directly communicate and share information with each other
- **Agent Marketplace**: Create a community marketplace where users can share and discover pre-built agents
- **Advanced Orchestration**: Implement more sophisticated execution strategies like hierarchical and recursive agent systems
- **Streaming Responses**: Add real-time streaming of agent responses for better user experience
- **Agent Analytics**: Provide detailed analytics on agent performance, usage patterns, and optimization suggestions
- **Multi-Modal Support**: Extend agents to handle images, audio, and video inputs
- **Plugin System**: Allow users to extend agent capabilities through custom plugins
- **Team Collaboration**: Enable multiple users to collaborate on building and managing agent societies

## Deployment

Deploy to Vercel or another Node.js host. Set `TURSO_DATABASE_URL`,
`TURSO_AUTH_TOKEN`, `API_KEY_ENCRYPTION_SECRET`, and the provider key variables
in the host environment, then run `npm run db:migrate` against the production
Turso database before opening the app.