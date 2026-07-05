import { NextResponse } from 'next/server';
import { generateText, generateStreamingText } from '@/lib/gemini';

// Example API route for Gemini
export async function POST(request) {
  try {
    const { prompt, stream = false } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (stream) {
      // Streaming response
      const stream = await generateStreamingText(prompt);
      
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      });
    } else {
      // Regular response
      const response = await generateText(prompt);
      return NextResponse.json({ response });
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', details: error.message },
      { status: 500 }
    );
  }
}
