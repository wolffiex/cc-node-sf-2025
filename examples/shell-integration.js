#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');

// Attempt 1: Basic spawn (aliases won't work)
function basicShellAttempt() {
    console.log("\n1. Basic spawn attempt (aliases won't work):");
    
    // Can't use -i (interactive) flag because:
    // - It would block waiting for input with no PTY
    // - Node's spawn doesn't allocate a pseudo-terminal
    // - Would block the event loop indefinitely
    // Must use -c to run command and exit immediately
    const shell = spawn('bash', ['-c', 'alias hello="echo Hello from alias"; hello']);
    
    shell.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    
    shell.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    
    shell.on('close', (code) => {
        console.log(`Shell exited with code ${code}`);
        console.log("Result: No output - aliases don't work in non-interactive mode!");
    });
}

// Attempt 2: Try to use FIFOs (problematic in Node)
async function fifoAttempt() {
    console.log("\n2. FIFO attempt:");
    
    const fifoPath = '/tmp/node_shell_fifo';
    
    // Clean up any existing FIFO first
    try {
        fs.unlinkSync(fifoPath);
    } catch (e) {
        // Ignore if doesn't exist
    }
    
    try {
        // Node can't create FIFOs directly - must shell out
        execSync(`mkfifo ${fifoPath}`);
        console.log("Created FIFO using execSync (not native!)");
        
        // This is where it gets problematic...
        // Reading from FIFO blocks the entire event loop!
        
        // Remember: In Python we used fork() to handle this cleanly:
        // - Parent process could block on FIFO read
        // - Child process wrote to FIFO
        // - No event loop to worry about!
        // In Node, we can't fork() and blocking kills everything
        
        // Spawn a child to write to FIFO
        const writer = spawn('bash', ['-c', `echo "Hello from FIFO" > ${fifoPath}`]);
        
        // Try to read - this will block everything!
        console.log("Warning: About to block event loop reading FIFO...");
        
        // We have to use readFileSync or it won't work at all
        setTimeout(() => {
            try {
                const data = fs.readFileSync(fifoPath, 'utf8');
                console.log(`Received: ${data}`);
            } catch (e) {
                console.error("Failed to read from FIFO:", e.message);
            }
        }, 100);
        
    } catch (e) {
        console.error("FIFO operations failed:", e.message);
    } finally {
        try {
            fs.unlinkSync(fifoPath);
        } catch (e) {}
    }
}

// Demonstrate signal handling limitations
function signalHandlingDemo() {
    console.log("\n3. Signal handling limitations:");
    
    // Spawn a shell that runs multiple processes
    const child = spawn('bash', ['-c', 'echo "Parent bash PID: $$"; sleep 5 & echo "Background sleep PID: $!"; wait']);
    
    child.stdout.on('data', (data) => {
        console.log(`Child output: ${data.toString().trim()}`);
    });
    
    // Try to kill after 1 second
    setTimeout(() => {
        console.log("Killing child process...");
        child.kill('SIGTERM');
        // Problem: This only kills bash, not the background sleep!
        console.log("Killed bash, but background processes may still be running!");
    }, 1000);
    
    console.log("Node can't:");
    console.log("- Create new sessions (no setsid)");
    console.log("- Kill entire process groups");
    console.log("- Properly manage child process trees");
}

// Main demo
async function main() {
    console.log("Node.js Shell Integration Demo");
    console.log("=".repeat(40));
    console.log("\nShowing why Node struggles with shell integration...");
    
    basicShellAttempt();
    
    setTimeout(async () => {
        await fifoAttempt();
        
        setTimeout(() => {
            signalHandlingDemo();
            
            console.log("\n" + "=".repeat(40));
            console.log("Summary of Node.js limitations:");
            console.log("- No native PTY support (need compiled addons)");
            console.log("- No native FIFO creation");
            console.log("- FIFOs block the event loop");
            console.log("- Limited signal handling");
            console.log("- Can't create proper interactive shells");
            console.log("\nResult: Aliases and proper shell integration are very difficult!");
        }, 2000);
    }, 1000);
}

main().catch(console.error);
