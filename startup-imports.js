#!/usr/bin/env node

// Node with common imports - still fast!
const fs = require('fs');
const path = require('path');
const os = require('os');
const child_process = require('child_process');
const readline = require('readline');

const args = process.argv.slice(2);
console.log(`Hello from Node with imports! Args: ${args.join(', ') || 'none'}`);
process.exit(0);