# Vercel Deployment Checklist ✅

## Pre-Deployment: Environment Variables Setup

### Required Environment Variables in Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **Production** environment variables:

```
Variable Name: GEMINI_API_KEY
Value: AQ.Ab8RN6JMSloqYX7VP6IPlfgfrxVzaRc6OTiv0OClWthtLXJN8Q
Environment: Production
```

```
Variable Name: DEFAULT_PROVIDER  
Value: gemini
Environment: Production
```

```
Variable Name: DEFAULT_MODEL
Value: gemini-2.5-flash  
Environment: Production
```

```
Variable Name: NEXT_PUBLIC_ENCRYPTION_KEY
Value: your-secure-random-key-here
Environment: Production, Preview, Development
```

### ⚠️ CRITICAL CHECKS:

1. **NO `NEXT_PUBLIC_` prefix on `GEMINI_API_KEY`**
   - ✅ Correct: `GEMINI_API_KEY`
   - ❌ Wrong: `NEXT_PUBLIC_GEMINI_API_KEY`
   - Why: Server-only variables should NOT be exposed to client

2. **API Key Format Validation**
   - Your key starts with `AQ.` which is the new Gemini format ✅
   - Length should be ~50+ characters ✅
   - No spaces or newlines at the beginning/end

3. **Environment Selection**
   - Select "Production" for live deployment
   - Optionally add to "Preview" for testing

## Deployment Steps

### Step 1: Verify Local Environment

```bash
# Check .env.local has the key
cat .env.local | grep GEMINI_API_KEY

# Should output:
# GEMINI_API_KEY=AQ.Ab8RN6JMSloqYX7VP6IPlfgfrxVzaRc6OTiv0OClWthtLXJN8Q
```

### Step 2: Commit and Push

```bash
git add .
git commit -m "Add Vercel production environment fallback"
git push origin main
```

### Step 3: Deploy to Vercel

Vercel will automatically deploy on push. Or manually:

```bash
vercel --prod
```

### Step 4: Check Vercel Logs

After deployment, test the app and check logs:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Click "View Function Logs" or "Runtime Logs"

Look for these diagnostic messages:

```
✅ Good Signs:
========== API ROUTE DEBUG START ==========
- Is GEMINI_API_KEY present?: true
- GEMINI_API_KEY length: 52
- GEMINI_API_KEY starts with: AQ.Ab
✅ Using environment variable fallback
✅ Config created successfully
✅ Provider client created successfully
✅ Response received
```

```
❌ Bad Signs:
- Is GEMINI_API_KEY present?: false
❌ CRITICAL: No API key found in environment variables
```

## Debugging Failed Deployment

### Issue: "No LLM provider configured"

**Check 1: Environment Variable Name**
```bash
# In Vercel Dashboard, verify exact name is:
GEMINI_API_KEY
# NOT:
GOOGLE_API_KEY
NEXT_PUBLIC_GEMINI_API_KEY
GEMINI_KEY
```

**Check 2: Environment Scope**
- Make sure "Production" environment is selected
- Not just "Preview" or "Development"

**Check 3: Redeploy After Adding Variables**
- Environment variables require a redeploy to take effect
- Go to Deployments → Click "Redeploy" on latest deployment

**Check 4: Check Runtime Logs**
```
In Vercel Dashboard:
Deployments → [Your Deployment] → Functions → agent-chat → View Logs

Look for:
"Is GEMINI_API_KEY present?: false"
```

### Issue: "Failed to initialize Gemini client"

**Possible Causes:**

1. **Invalid API Key Format**
   - Check key has no extra spaces
   - Verify it starts with `AQ.` or `AIza`
   - Test key locally first

2. **API Key Permissions**
   - Ensure key is enabled in Google AI Studio
   - Check API quota/limits

3. **Network Issues**
   - Vercel functions might be timing out
   - Check function execution time in logs

### Issue: Encryption/Decryption Error

**Solution:**
Make sure `NEXT_PUBLIC_ENCRYPTION_KEY` is set in ALL environments:
- Production
- Preview  
- Development

**Why:** The same key must be used to encrypt and decrypt API keys.

## Testing the Deployment

### Test 1: Check API Route Health

```bash
curl -X POST https://your-app.vercel.app/api/agent-chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello",
    "agent": {
      "name": "Test Agent",
      "goal": "Test",
      "temperature": 0.7,
      "maxTokens": 100
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "Hello! How can I help you today?",
  "provider": "gemini",
  "model": "gemini-2.5-flash"
}
```

### Test 2: Check Environment Variables via Vercel CLI

```bash
vercel env ls
```

Should show:
```
GEMINI_API_KEY (Production)
DEFAULT_PROVIDER (Production)
DEFAULT_MODEL (Production)
NEXT_PUBLIC_ENCRYPTION_KEY (Production, Preview, Development)
```

### Test 3: Pull Production Environment Locally

```bash
vercel env pull .env.production.local
cat .env.production.local
```

Verify your API key is there.

## Common Mistakes to Avoid

❌ **Using `NEXT_PUBLIC_` prefix on API keys**
- This exposes keys to the browser
- Server-side API keys should NOT have this prefix

❌ **Not redeploying after adding environment variables**
- Variables only apply to NEW deployments
- Always redeploy after changes

❌ **Forgetting to select "Production" environment**
- Variables set for "Preview" won't work in production

❌ **API key with extra whitespace**
- Copy-paste errors can add spaces
- Trim before adding to Vercel

❌ **Not checking Vercel function logs**
- Logs show exactly what's happening
- Always check logs first when debugging

## Architecture Verification

### ✅ Correct Setup:

```
Client (Browser)
  ↓
  [Sends agent + prompt]
  ↓
Server API Route (/api/agent-chat)
  ↓
  [Reads process.env.GEMINI_API_KEY]
  ↓
Provider Factory (server-side)
  ↓
Gemini API
```

### ❌ Incorrect Setup:

```
Client Component ('use client')
  ↓
  [Tries to read process.env.GEMINI_API_KEY] ← FAILS
  ↓
process.env is undefined in browser
```

## File Checklist

✅ Files that are server-side only:
- `/api/agent-chat/route.js` - ✅ Correct (API Route)
- `/lib/provider-factory.js` - ✅ Correct (Used by API)
- `/lib/encryption.js` - ✅ Correct (Used by API)

⚠️ Files that are client-side:
- `/app/society/page.js` - Client Component (uses 'use client')
- Should NOT read process.env directly
- Must send request to API route

## Success Indicators

After deployment, you should see:

1. ✅ No "No LLM provider configured" errors
2. ✅ Agents respond to prompts
3. ✅ Vercel logs show API key is found
4. ✅ No encryption/decryption errors

## Need Help?

### View Logs:
```bash
vercel logs --follow
```

### Check specific deployment:
```bash
vercel logs [deployment-url]
```

### Re-deploy specific commit:
```bash
vercel --prod --force
```

---

## Quick Reference

**Vercel Dashboard Path:**
```
Dashboard → Project → Settings → Environment Variables
```

**Log Path:**
```
Dashboard → Project → Deployments → [Deployment] → Functions → agent-chat
```

**Environment Variable Format:**
```
Key: GEMINI_API_KEY
Value: AQ.Ab8RN6JMSloqYX7VP6IPlfgfrxVzaRc6OTiv0OClWthtLXJN8Q
Environment: ✅ Production
```
