#!/usr/bin/env bun

const API_KEY = process.env.ANTHROPIC_API_KEY

async function* streamCompletion(prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
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

async function* wrapLines(generator: AsyncGenerator<string>, width = 80) {
  let buffer = '';
  
  for await (const chunk of generator) {
    buffer += chunk;
    
    // Output complete lines
    while (buffer.length >= width) {
      // Find last space within the line width
      const spaceIndex = buffer.lastIndexOf(' ', width);
      
      if (spaceIndex > 0) {
        // Break at the space
        yield buffer.slice(0, spaceIndex) + '\n';
        buffer = buffer.slice(spaceIndex + 1); // Skip the space
      } else {
        // No space found, hard break
        yield buffer.slice(0, width) + '\n';
        buffer = buffer.slice(width);
      }
    }
  }
  
  // Output any remaining text
  if (buffer) {
    yield buffer;
  }
}

async function main() {
  console.log('Enter your prompt:');
  
  // Read from stdin until newline
  const prompt = await Bun.stdin.text();
  const trimmedPrompt = prompt.split('\n')[0].trim();
  
  if (!trimmedPrompt) {
    console.error('No prompt provided');
    process.exit(1);
  }
  console.log('\n--- Streaming response ---\n');

  try {
    for await (const chunk of wrapLines(streamCompletion(prompt))) {
    // for await (const chunk of streamCompletion(prompt)) {
      process.stdout.write(chunk);
    }

    console.log('\n\n--- End of response ---');
  } catch (error) {
    console.error('\nError:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}
