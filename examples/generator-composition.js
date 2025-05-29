#!/usr/bin/env bun

// Simulated async data source
async function* streamData() {
  const messages = ['hello', 'world', 'from', 'async', 'generators'];
  for (const msg of messages) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    yield msg
    yield " "
  }
}

// Split strings into individual characters
async function* chars(strings) {
  for await (const word of strings) {
    yield* word;  // yield* works perfectly with async!
  }
}

// Transform characters to uppercase
async function* upper(chars) {
  for await (const c of chars) {
    yield c.toUpperCase();
  }
}

// Add delays between characters for effect
async function* slowType(chars, ms = 50) {
  for await (const c of chars) {
    yield c;
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main - compose all the generators
async function main() {
  console.log('Streaming characters:\n');
  
  // Natural composition - just wrap generators
  const pipeline = slowType(upper(chars(streamData())));
  
  // Simple consumption
  for await (const c of pipeline) {
    process.stdout.write(c);
  }
  
  console.log('\n\nDone!');
}

// Run it
main().catch(console.error);
