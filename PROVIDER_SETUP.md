# Dynamic LLM Provider System - Setup Guide

## Architecture Overview

This system implements a **No-Code AI Agent Orchestrator** where users can dynamically configure their own LLM providers without code changes.

### Key Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  (/providers page - Configure API keys and test connection) │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Storage Layer (Local/DB)                    │
│  - Encrypted API Keys                                        │
│  - Provider Configuration (OpenAI, Gemini, Anthropic)       │
│  - Model Selection                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Provider Factory (Runtime)                      │
│  - Decrypts API Keys                                         │
│  - Dynamically initializes SDK clients                      │
│  - Returns unified interface                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Agent Execution                             │
│  - Pulls dynamic provider at runtime                         │
│  - Executes tasks without code changes                       │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── lib/
│   ├── db-schema.js              # Provider configuration schema
│   ├── encryption.js             # API key encryption utilities
│   ├── provider-factory.js       # Dynamic LLM client factory
│   └── provider-storage.js       # Local storage service
│
├── app/
│   ├── providers/
│   │   └── page.js               # Provider configuration UI
│   │
│   └── api/
│       ├── providers/
│       │   └── route.js          # Provider CRUD & test endpoint
│       │
│       └── agents/
│           └── execute/
│               └── route.js      # Agent execution with dynamic provider
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @google/genai zod
```

Optional (for OpenAI support):
```bash
npm install openai
```

Optional (for Anthropic support):
```bash
npm install @anthropic-ai/sdk
```

### 2. Configure Environment

Create or update `.env.local`:

```env
# Required: Encryption key for API keys
NEXT_PUBLIC_ENCRYPTION_KEY=your-secure-random-key-here

# Optional: Default Gemini key (for fallback)
GEMINI_API_KEY=your-gemini-key
```

**⚠️ IMPORTANT:** Change the encryption key in production!

### 3. Start Development Server

```bash
npm run dev
```

### 4. Configure Your First Provider

1. Navigate to `/providers`
2. Click "+ Add Provider"
3. Select a provider (Gemini, OpenAI, or Anthropic)
4. Enter your API key
5. Select a model
6. Click "Test Connection"
7. If successful, click "Save Provider"

## Usage Examples

### Example 1: Configure Gemini Provider

```javascript
// User configures via UI at /providers
{
  providerName: "gemini",
  apiKey: "AIza...your-key",
  selectedModel: "gemini-2.5-flash"
}

// System automatically:
// 1. Encrypts the API key
// 2. Saves to storage
// 3. Tests connection
// 4. Makes it available for agents
```

### Example 2: Execute Agent Task

```javascript
// In your agent code
import { getActiveProvider } from "@/lib/provider-storage";
import { executeAgentTask } from "@/lib/provider-factory";

const provider = getActiveProvider("user-id");
const response = await executeAgentTask(
  provider,
  "Your prompt here",
  {
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: "You are a helpful assistant",
  }
);
```

### Example 3: API Route Usage

```javascript
// POST /api/agents/execute
{
  "providerConfig": {
    "providerName": "gemini",
    "encryptedApiKey": "...",
    "selectedModel": "gemini-2.5-flash"
  },
  "prompt": "Explain quantum computing",
  "agentConfig": {
    "temperature": 0.7,
    "systemPrompt": "You are a physics expert"
  }
}
```

## Security Considerations

### Current Implementation (Demo)
- ✅ API keys are encrypted before storage
- ✅ Keys are masked in UI
- ✅ Client-side storage for demo purposes
- ⚠️ Basic encryption (not production-ready)

### Production Recommendations

1. **Server-Side Encryption**
   ```javascript
   // Use Node.js crypto
   import crypto from 'crypto';
   
   const algorithm = 'aes-256-gcm';
   const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
   ```

2. **Database Storage**
   - Replace local storage with PostgreSQL/MongoDB
   - Use database-level encryption
   - Implement row-level security

3. **Key Management**
   - Use AWS KMS, Azure Key Vault, or HashiCorp Vault
   - Rotate encryption keys regularly
   - Never commit keys to version control

4. **Authentication**
   - Implement proper user authentication (NextAuth.js, Clerk, etc.)
   - Associate providers with authenticated users
   - Implement rate limiting

5. **API Key Validation**
   - Validate key format before saving
   - Test connection before allowing save
   - Implement key rotation mechanism

## Extending the System

### Add New Provider

1. Update `src/lib/db-schema.js`:
```javascript
export const PROVIDERS = {
  OPENAI: "openai",
  GEMINI: "gemini",
  YOUR_PROVIDER: "your-provider", // Add here
};
```

2. Update `src/lib/provider-factory.js`:
```javascript
createYourProviderClient() {
  const client = new YourProviderSDK({ apiKey: this.apiKey });
  return {
    provider: PROVIDERS.YOUR_PROVIDER,
    client,
    model: this.model,
    async generateContent(prompt, options = {}) {
      // Implement provider-specific logic
      return response;
    },
  };
}
```

3. Add to factory switch statement:
```javascript
case PROVIDERS.YOUR_PROVIDER:
  return this.createYourProviderClient();
```

## Troubleshooting

### API Key Not Working
- Verify key format matches provider requirements
- Check if key has proper permissions
- Test key directly with provider's API

### Connection Test Fails
- Check network connectivity
- Verify API endpoint is accessible
- Review browser console for errors

### Encryption Errors
- Ensure `NEXT_PUBLIC_ENCRYPTION_KEY` is set
- Check that key hasn't changed between saves
- Clear local storage and reconfigure

## API Reference

### Provider Factory

```javascript
import { LLMProviderFactory } from '@/lib/provider-factory';

const factory = new LLMProviderFactory(userProviderConfig);
const client = factory.getClient();
const response = await client.generateContent(prompt, options);
```

### Storage Service

```javascript
import { 
  saveProvider,
  getAllProviders,
  getActiveProvider,
  deleteProvider 
} from '@/lib/provider-storage';
```

### Encryption Utils

```javascript
import { 
  encryptApiKey,
  decryptApiKey,
  maskApiKey 
} from '@/lib/encryption';
```

## Next Steps

1. ✅ Basic provider configuration
2. ✅ Dynamic factory pattern
3. ✅ Test connection feature
4. 🔄 Migrate to database storage
5. 🔄 Implement proper encryption
6. 🔄 Add user authentication
7. 🔄 Build agent execution UI
8. 🔄 Add execution history
9. 🔄 Implement rate limiting
10. 🔄 Add provider usage analytics

## Support

For issues or questions:
- Check browser console for errors
- Review API responses in Network tab
- Verify environment variables are set
- Test API keys directly with provider

---

**Remember:** This is a demo implementation. For production use, implement proper security measures including server-side encryption, database storage, and user authentication.
