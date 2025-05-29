#!/usr/bin/env bun

// Bun with common imports - still blazing fast!
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import readline from 'readline';

const args = Bun.argv.slice(2);
console.log(`Hello from Bun with imports! Args: ${args.join(', ') || 'none'}`);
process.exit(0);