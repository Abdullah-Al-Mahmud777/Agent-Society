# Gemini API Setup Guide

## 1. Get Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## 2. Configure Environment Variables

Add your API key to `.env.local`:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** Never commit `.env.local` to version control!

## 3. Usage Examples

### Basic Text Generation

```javascript
import { generateText } from '@/lib/gemini';

const response = await generateText('Tell me a joke');
console.log(response);
```

### Streaming Response

```javascript
import { generateStreamingText } from '@/lib/gemini';

const stream = await generateStreamingText('Write a story');
for await (const chunk of stream) {
  process.stdout.write(chunk.text());
}
```

### Chat with History

```javascript
import { chat } from '@/lib/gemini';

const history = [
  { role: 'user', parts: [{ text: 'Hello!' }] },
  { role: 'model', parts: [{ text: 'Hi! How can I help?' }] }
];

const response = await chat(history, 'What is AI?');
console.log(response);
```

### Using the API Route

```javascript
// From your client component
const response = await fetch('/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Explain quantum computing',
    stream: false
  })
});

const data = await response.json();
console.log(data.response);
```

## 4. Available Models

- `gemini-2.0-flash-exp` (default) - Fast and efficient
- `gemini-1.5-pro` - Most capable model
- `gemini-1.5-flash` - Balanced performance

Change model by passing it as second parameter:
```javascript
await generateText('Your prompt', 'gemini-1.5-pro');
```

## 5. Rate Limits

Free tier includes:
- 15 requests per minute
- 1 million tokens per minute
- 1,500 requests per day

## 6. Error Handling

Always wrap Gemini calls in try-catch:

```javascript
try {
  const response = await generateText(prompt);
  // Handle response
} catch (error) {
  console.error('Gemini error:', error.message);
  // Handle error
}
```

## Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Node.js SDK Reference](https://ai.google.dev/api/node)
- [Get API Key](https://aistudio.google.com/app/apikey)
