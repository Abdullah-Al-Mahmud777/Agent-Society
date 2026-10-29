# Agent Society Architecture Diagram

## System Architecture with Qwen Cloud Integration

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[User Interface<br/>Next.js 16 + React]
        SOCIETY[Society Page<br/>Agent Interaction]
        BUILDER[Agent Builder<br/>Create Custom Agents]
        PROVIDERS[Providers Page<br/>API Key Management]
        
        UI --> SOCIETY
        UI --> BUILDER
        UI --> PROVIDERS
    end
    
    subgraph "State Management"
        ZUSTAND[Zustand Store<br/>State Management]
        LOCAL[Local Storage<br/>Encrypted API Keys]
        AGENT_DB[Agent Database<br/>Indexed Queries]
        
        SOCIETY --> ZUSTAND
        BUILDER --> ZUSTAND
        PROVIDERS --> ZUSTAND
        ZUSTAND --> LOCAL
        ZUSTAND --> AGENT_DB
    end
    
    subgraph "API Layer - Next.js Routes"
        API_CHAT["API Chat Route<br/>/api/agent-chat<br/>Single Agent"]
        API_ORCH["Orchestrator Route<br/>/api/orchestrator/chat<br/>Multi-Agent"]
        API_PROV["Providers Route<br/>/api/providers<br/>Provider Management"]
        
        SOCIETY --> API_CHAT
        SOCIETY --> API_ORCH
        PROVIDERS --> API_PROV
    end
    
    subgraph "Provider Factory Layer"
        FACTORY[LLMProviderFactory<br/>Dynamic Client Creation]
        RETRY[Retry Logic<br/>Exponential Backoff]
        FALLBACK[Fallback Models<br/>Automatic Switching]
        ERROR[Error Handling<br/>401, 429, 500]
        
        API_CHAT --> FACTORY
        API_ORCH --> FACTORY
        API_PROV --> FACTORY
        FACTORY --> RETRY
        FACTORY --> FALLBACK
        FACTORY --> ERROR
    end
    
    subgraph "LLM Providers"
        QWEN[Qwen Cloud<br/>Alibaba DashScope API]
        OPENAI[OpenAI<br/>GPT Models]
        ANTHROPIC[Anthropic<br/>Claude Models]
        OPENROUTER[OpenRouter<br/>Multi-Model Access]
        
        FACTORY --> QWEN
        FACTORY --> OPENAI
        FACTORY --> ANTHROPIC
        FACTORY --> OPENROUTER
    end
    
    subgraph "Qwen Cloud Details"
        QWEN_API[DashScope API<br/>https://dashscope.aliyuncs.com]
        QWEN_AUTH[Authentication<br/>API Key]
        QWEN_MODELS[Qwen Models<br/>qwen-turbo, qwen-plus]
        QWEN_RESP[Response Processing<br/>JSON Format]
        
        QWEN --> QWEN_API
        QWEN --> QWEN_AUTH
        QWEN --> QWEN_MODELS
        QWEN --> QWEN_RESP
    end
    
    subgraph "Environment & Security"
        ENV[.env.local<br/>Environment Variables]
        ENCRYPTION[AES-256-GCM<br/>API Key Encryption]
        VERCEL[Vercel Deployment<br/>Server-side Variables]
        
        LOCAL --> ENV
        PROVIDERS --> ENCRYPTION
        API_CHAT --> ENV
        API_ORCH --> ENV
        ENV --> VERCEL
    end
    
    style UI fill:#e1f5ff
    style ZUSTAND fill:#fff4e1
    style FACTORY fill:#e8f5e9
    style QWEN fill:#fce4ec
    style ENV fill:#f3e5f5
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend UI
    participant API as API Routes
    participant Factory as Provider Factory
    participant Qwen as Qwen Cloud
    participant Storage as Local Storage
    
    User->>UI: Send Message
    UI->>Storage: Load Agent Config
    Storage-->>UI: Return Agent Data
    UI->>API: POST /api/orchestrator/chat
    API->>Factory: Create LLM Client
    Factory->>Storage: Get Encrypted API Key
    Storage-->>Factory: Return Decrypted Key
    Factory->>Qwen: API Request with Qwen Key
    Qwen-->>Factory: LLM Response
    Factory-->>API: Processed Response
    API-->>UI: Final Response
    UI-->>User: Display Agent Response
```

## Component Interaction Diagram

```mermaid
graph LR
    A[User Request] --> B[Agent Discovery]
    B --> C[Relevance Scoring]
    C --> D[Agent Selection]
    D --> E[Execution Strategy]
    E --> F{Parallel?}
    F -->|Yes| G[Parallel Execution]
    F -->|No| H[Sequential Execution]
    G --> I[Response Synthesis]
    H --> I
    I --> J[Final Response]
    
    style A fill:#ffcccc
    style B fill:#ccffcc
    style C fill:#ccccff
    style D fill:#ffffcc
    style E fill:#ffccff
    style I fill:#ccffff
    style J fill:#ffffff
```

## Qwen Cloud Integration Details

```mermaid
graph TB
    subgraph "Qwen Cloud Connection Flow"
        A[Application] --> B[Provider Factory]
        B --> C{Provider Check}
        C -->|Qwen| D[Qwen Client]
        C -->|OpenRouter| E[OpenRouter Client]
        C -->|OpenAI| F[OpenAI Client]
        
        D --> G[DashScope API]
        E --> H[OpenRouter API]
        F --> I[OpenAI API]
        
        G --> J[Qwen Models]
        H --> K[Multiple Models]
        I --> L[GPT Models]
        
        subgraph "Qwen Cloud Specific"
            G --> M[Authentication<br/>API Key]
            G --> N[Request Format<br/>JSON]
            G --> O[Response Format<br/>Message]
            G --> P[Rate Limits<br/>Handled by Retry Logic]
        end
    end
    
    style D fill:#fce4ec
    style G fill:#f8bbd0
    style M fill:#e1bee7
    style N fill:#e1bee7
    style O fill:#e1bee7
    style P fill:#e1bee7
```

## Security Layer Diagram

```mermaid
graph TB
    subgraph "Security Architecture"
        A[User Input] --> B[Validation]
        B --> C[Encryption Layer]
        C --> D[AES-256-GCM]
        D --> E[Local Storage]
        
        F[API Key] --> G[Encryption]
        G --> H[Encrypted Storage]
        H --> I[Decryption on Use]
        I --> J[API Calls]
        
        K[Environment Variables] --> L[Server-side]
        L --> M[Production Deployment]
        
        N[Rate Limiting] --> O[Exponential Backoff]
        O --> P[Retry Logic]
        
        Q[Error Handling] --> R[401 Auth Errors]
        Q --> S[429 Rate Limits]
        Q --> T[500 Server Errors]
    end
    
    style C fill:#ffebee
    style D fill:#ffcdd2
    style G fill:#ffebee
    style H fill:#ffcdd2
    style O fill:#e8f5e9
    style P fill:#c8e6c9
```


