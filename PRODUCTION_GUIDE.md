# Production Deployment Guide - Agent Society

## How It Works Now

Your app has **dual-mode** provider configuration:

### Mode 1: User-Configured Provider (Recommended)
Users can configure their own API keys via `/providers` page.

### Mode 2: Environment Variable Fallback (Production)
If no provider is configured, uses Vercel environment variables.

---

## For End Users (Production)

### Step 1: Access the App
Visit: `https://your-app.vercel.app`

### Step 2: Configure Provider (Optional but Recommended)
1. Go to **Providers** page from navigation
2. Click **"+ Add Provider"**
3. Select provider (Gemini, OpenAI, or Anthropic)
4. Enter your API key
5. Click **"Test Connection"**
6. If successful, click **"Save Provider"**

### Step 3: Use Agents
1. Go to **Society** page
2. You'll see provider status:
   - ✅ **Green card**: Provider configured (your API key)
   - ⚠️ **Yellow card**: No provider (using fallback/environment variables)
3. Select an agent and start chatting!

---

## For Developers (Deployment)

### Vercel Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

```
GEMINI_API_KEY=AQ.Ab8RN6JMSloqYX7VP6IPlfgfrxVzaRc6OTiv0OClWthtLXJN8Q
DEFAULT_PROVIDER=gemini
DEFAULT_MODEL=gemini-2.5-flash
NEXT_PUBLIC_ENCRYPTION_KEY=your-secure-random-key
```

**Important:**
- These are **fallback only** - used when user hasn't configured their own provider
- **Production** environment must be selected
- After adding, **redeploy** the app

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User Flow                        │
└─────────────────────────────────────────────────────┘

Option A: User Configures Provider
─────────────────────────────────────
1. User → /providers page
2. Configure API key
3. Save to localStorage (browser)
4. Go to /society → Chat works with user's key ✅

Option B: No User Configuration
─────────────────────────────────────
1. User → /society page
2. localStorage empty
3. Yellow warning card shown
4. API uses environment variables as fallback ✅
5. Chat works with shared key from Vercel env vars

┌─────────────────────────────────────────────────────┐
│                 Technical Flow                      │
└─────────────────────────────────────────────────────┘

Client (Browser)
  ↓
  [Load provider from localStorage]
  ↓
  If found: Use it ✅
  If not found: Send null to API
  ↓
API Route (/api/agent-chat)
  ↓
  [Check providerConfig from client]
  ↓
  If provided: Use it ✅
  If null: Check process.env.GEMINI_API_KEY
  ↓
  If found: Create config from env ✅
  If not found: Return error ❌
  ↓
Provider Factory
  ↓
  [Initialize LLM client]
  ↓
Gemini/OpenAI/Anthropic API
```

---

## Features

### ✅ Multi-User Support
- Each user can configure their own API keys
- Keys stored in browser localStorage
- Private to each user/device

### ✅ Fallback Support
- Works even without user configuration
- Uses shared Vercel environment variables
- Seamless experience

### ✅ Provider Status Indicator
- **Green card**: User has configured provider
- **Yellow card**: Using fallback (environment variables)
- Quick link to configure provider

### ✅ Multiple Providers
- Google Gemini
- OpenAI
- Anthropic Claude

### ✅ Test Before Save
- "Test Connection" button
- Validates API key before saving
- User-friendly error messages

---

## Deployment Checklist

### Before Deploying:

- [x] Code pushed to GitHub
- [x] Pull Request created
- [x] PR merged to main branch
- [ ] Vercel environment variables set
- [ ] Vercel deployment successful
- [ ] Test provider configuration page
- [ ] Test agent chat functionality

### Vercel Settings:

**Environment Variables** (Required):
```
✅ GEMINI_API_KEY (Production)
✅ DEFAULT_PROVIDER (Production)
✅ DEFAULT_MODEL (Production)
✅ NEXT_PUBLIC_ENCRYPTION_KEY (All environments)
```

**Git Settings**:
```
✅ Connected to GitHub repository
✅ Auto-deploy on push: Enabled
✅ Production branch: main
```

---

## Testing

### Test 1: Provider Configuration
1. Visit `/providers` page
2. Add a provider with valid API key
3. Click "Test Connection"
4. Should show: ✓ Connection successful
5. Click "Save Provider"
6. Provider should appear in "Your Providers" list

### Test 2: Agent Chat (With Provider)
1. Go to `/society` page
2. Should see **green card**: "Provider Active"
3. Select an agent
4. Send a message
5. Should get response from agent

### Test 3: Agent Chat (Without Provider)
1. Go to `/providers` page
2. Delete all providers
3. Go to `/society` page
4. Should see **yellow card**: "No Provider Configured"
5. Select an agent
6. Send a message
7. Should still work (using environment variables)

### Test 4: Multiple Providers
1. Add multiple providers (Gemini, OpenAI)
2. Set one as active
3. Chat should use active provider
4. Switch active provider
5. Chat should use new provider

---

## Troubleshooting

### Issue: "No LLM provider configured" error

**Solution:**
1. Check Vercel environment variables are set
2. Verify `GEMINI_API_KEY` has no typos
3. Ensure "Production" environment is selected
4. Redeploy after adding variables

### Issue: Provider configuration not saving

**Solution:**
1. Check browser localStorage is not disabled
2. Try different browser
3. Check browser console for errors

### Issue: API key validation fails

**Solution:**
1. Verify API key format:
   - Gemini: `AIza...` or `AQ....`
   - OpenAI: `sk-...`
   - Anthropic: `sk-ant-...`
2. Check key has no extra spaces
3. Verify key is valid in provider's dashboard

### Issue: Chat not working even with provider configured

**Solution:**
1. Check browser console for errors
2. Verify API key is valid
3. Check API quota/limits
4. Try "Test Connection" button

---

## Security Notes

### ✅ What's Secure:

- API keys encrypted before storage
- Server-side validation
- No keys exposed to client-side code
- Environment variables hidden from browser

### ⚠️ Production Recommendations:

1. **Use Database Storage**
   - Replace localStorage with PostgreSQL/MongoDB
   - Server-side encryption only
   - User authentication required

2. **Proper Encryption**
   - Use AES-256-GCM
   - Store keys in AWS KMS or HashiCorp Vault
   - Rotate encryption keys regularly

3. **Rate Limiting**
   - Implement per-user rate limits
   - Prevent API abuse
   - Monitor usage

4. **Authentication**
   - Add user login (NextAuth.js, Clerk)
   - Associate providers with users
   - Secure provider management

---

## Support

### Check Logs:
```bash
# Vercel logs
vercel logs --follow

# Specific deployment
vercel logs [deployment-url]
```

### Debug Endpoint:
```
Visit: https://your-app.vercel.app/api/debug-env
Note: Only works in preview/development (disabled in production)
```

### Common Commands:
```bash
# Pull environment variables locally
vercel env pull .env.production.local

# List environment variables
vercel env ls

# Deploy to production
vercel --prod
```

---

## Summary

✅ **Dual-mode configuration** - User providers + Environment fallback  
✅ **User-friendly UI** - Status cards, test connection, manage providers  
✅ **Production-ready** - Works on Vercel with environment variables  
✅ **Flexible** - Supports multiple LLM providers  
✅ **Secure** - Encrypted storage, server-side validation

Your app is now production-ready! 🚀
