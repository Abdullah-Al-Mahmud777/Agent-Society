# Vercel Deployment Guide

## Problem: localStorage doesn't work in production

**Issue:** The app uses `localStorage` to store LLM provider configs (API keys). This works locally but fails on Vercel because:
- localStorage is browser-only (client-side)
- Data doesn't persist across deployments
- Each user needs their own config (not shared)

## Solution Options

### Option 1: Environment Variables (Quick Fix - Single User)

**Use Case:** Personal projects, single-user deployments

**Steps:**

1. **Add to Vercel Environment Variables:**
   ```
   Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
   
   Add these variables:
   GEMINI_API_KEY=your-actual-key-here
   OPENAI_API_KEY=your-openai-key-here (optional)
   ANTHROPIC_API_KEY=your-anthropic-key-here (optional)
   DEFAULT_PROVIDER=gemini
   DEFAULT_MODEL=gemini-2.5-flash
   ```

2. **Update API route** to use environment variables as fallback:

```javascript
// src/app/api/agent-chat/route.js
export async function POST(request) {
    try {
        const { prompt, agent, providerConfig } = await request.json();

        // Fallback to environment variables if no provider config
        let config = providerConfig;
        
        if (!config && process.env.DEFAULT_PROVIDER) {
            // Use environment variables
            const apiKey = process.env.GEMINI_API_KEY || 
                          process.env.OPENAI_API_KEY || 
                          process.env.ANTHROPIC_API_KEY;
                          
            if (!apiKey) {
                return NextResponse.json({
                    success: false,
                    error: "No API key configured"
                }, { status: 500 });
            }
            
            config = {
                providerName: process.env.DEFAULT_PROVIDER,
                selectedModel: process.env.DEFAULT_MODEL || "gemini-2.5-flash",
                encryptedApiKey: encryptApiKey(apiKey),
                userId: "default-user",
                isActive: true
            };
        }

        // Rest of your code...
    }
}
```

### Option 2: Database Storage (Production-Ready - Multi-User)

**Use Case:** Production apps with multiple users

**Recommended Stack:**
- **Vercel Postgres** (easiest integration)
- **Supabase** (PostgreSQL + Auth)
- **MongoDB Atlas**
- **PlanetScale** (MySQL)

**Implementation:**

1. **Create database table:**
```sql
CREATE TABLE user_providers (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  provider_name VARCHAR(50) NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  selected_model VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

2. **Install database client:**
```bash
npm install @vercel/postgres
# or
npm install @supabase/supabase-js
```

3. **Replace localStorage with database calls:**

```javascript
// src/lib/provider-storage-db.js
import { sql } from '@vercel/postgres';

export async function getActiveProvider(userId) {
  try {
    const { rows } = await sql`
      SELECT * FROM user_providers 
      WHERE user_id = ${userId} AND is_active = true 
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

export async function saveProvider(providerData) {
  try {
    const { rows } = await sql`
      INSERT INTO user_providers (
        id, user_id, provider_name, encrypted_api_key, 
        selected_model, is_active
      ) VALUES (
        gen_random_uuid(), ${providerData.userId}, 
        ${providerData.providerName}, ${providerData.encryptedApiKey},
        ${providerData.selectedModel}, ${providerData.isActive}
      )
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}
```

### Option 3: Hybrid Approach (Best of Both)

**localStorage for development** + **Database for production**

```javascript
// src/lib/provider-storage-hybrid.js
const isProduction = process.env.NODE_ENV === 'production';
const isDatabaseAvailable = !!process.env.POSTGRES_URL;

export function getActiveProvider(userId) {
  // Use database in production if available
  if (isProduction && isDatabaseAvailable) {
    return getActiveProviderFromDB(userId);
  }
  
  // Fall back to localStorage in development
  if (typeof window !== 'undefined') {
    return getActiveProviderFromLocalStorage(userId);
  }
  
  // Server-side fallback to env variables
  return getProviderFromEnv();
}
```

## Recommended: Option 1 + Option 3

**For your current situation:**

1. **Immediate fix:** Add environment variables to Vercel
2. **Update code:** Add fallback to read from env vars
3. **Future:** Migrate to database when you need multi-user support

## Step-by-Step Vercel Setup

1. **Go to Vercel Dashboard**
   - Select your project
   - Click "Settings"
   - Click "Environment Variables"

2. **Add Variables:**
   ```
   GEMINI_API_KEY = AQ.Ab8RN6JMSloqYX7VP6IPlfgfrxVzaRc6OTiv0OClWthtLXJN8Q
   DEFAULT_PROVIDER = gemini
   DEFAULT_MODEL = gemini-2.5-flash
   ```

3. **Redeploy:**
   - Go to "Deployments"
   - Click "Redeploy" on latest deployment

## Testing

### Local (with localStorage):
```bash
npm run dev
# Works as before - uses localStorage
```

### Production (with env vars):
```bash
vercel env pull .env.production
npm run build
npm start
# Uses environment variables
```

## Security Notes

✅ **DO:**
- Use environment variables for API keys in production
- Encrypt API keys before storing in database
- Use Vercel's built-in encryption for env vars
- Implement proper authentication before multi-user

❌ **DON'T:**
- Commit API keys to git
- Send unencrypted keys over network
- Use `NEXT_PUBLIC_` prefix for API keys (exposes to client)
- Share environment variables publicly

## Need Help?

Check Vercel logs:
```bash
vercel logs [deployment-url]
```

Or enable debug mode:
```javascript
console.log('Provider config:', providerConfig ? 'Found' : 'Missing');
console.log('Env fallback:', process.env.DEFAULT_PROVIDER);
```
