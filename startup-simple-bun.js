#!/usr/bin/env bun

// Same program for Bun
const args = Bun.argv.slice(2);
console.log(`Hello from Bun! Args: ${args.join(', ') || 'none'}`);
process.exit(0);