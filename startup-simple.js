#!/usr/bin/env node

// Simple CLI that does minimal work
const args = process.argv.slice(2);
console.log(`Hello from Node.js! Args: ${args.join(', ') || 'none'}`);
process.exit(0);