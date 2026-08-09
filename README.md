# Agent Society — Autonomous AI Workforce

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
│  │  Local Storage (Agent Config, Provider Config)          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ /api/        │  │ /api/        │  │ /api/        │         │
│  │ agent-chat   │  │ agents/      │  │ providers   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐         │
│  │ Domain       │  │ Agent        │  │ Provider     │         │
│  │ Enforcement  │  │ Execution    │  │ Management   │         │
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
- **Society Page**: Main interface for interacting with agents
- **Agent Builder**: UI for creating and configuring custom agents
- **Providers Page**: UI for managing LLM provider configurations
- **State Management**: Zustand for agent and provider state
- **Local Storage**: Client-side persistence for configurations

### API Layer
- **Agent Chat Route**: `/api/agent-chat` - Handles chat requests with domain enforcement
- **Agent Execution Route**: `/api/agents/execute` - Executes agent tasks
- **Providers Route**: `/api/providers` - Manages provider configurations and testing

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

- **Domain Enforcement**: Agents only respond within their designated domains
- **Multi-Provider Support**: Switch between Gemini, OpenAI, Anthropic, Qwen
- **Fallback Models**: Automatic model switching on errors
- **Retry Logic**: Exponential backoff for transient errors
- **Provider Configuration**: UI-based API key management
- **Custom Agents**: Build specialized agents with specific domains

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Configure provider at `/providers`
5. Create agents at `/agent-builder`
6. Interact with agents at `/society`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions to Vercel and Alibaba Cloud.
