#!/usr/bin/env bun

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

async function* streamCompletion(prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              yield event.delta.text;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function* transformStream(generator: AsyncGenerator<string>) {
  let charCount = 0;
  for await (const chunk of generator) {
    charCount += chunk.length;
    yield chunk;
    
    // Example transformation: add periodic status updates
    if (charCount > 0 && charCount % 100 === 0) {
      yield `\n[${charCount} chars streamed]\n`;
    }
  }
}

async function main() {
  console.log('Enter your prompt (Ctrl+D when done):');
  
  // Read from stdin
  const chunks: Uint8Array[] = [];
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
  }
  
  const prompt = new TextDecoder().decode(Buffer.concat(chunks)).trim();
  if (!prompt) {
    console.error('No prompt provided');
    process.exit(1);
  }

  console.log('\n--- Streaming response ---\n');

  try {
    // Basic streaming
    for await (const chunk of streamCompletion(prompt)) {
      process.stdout.write(chunk);
    }

    // Example with transformation
    // for await (const chunk of transformStream(streamCompletion(prompt))) {
    //   process.stdout.write(chunk);
    // }

    console.log('\n\n--- End of response ---');
  } catch (error) {
    console.error('\nError:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}