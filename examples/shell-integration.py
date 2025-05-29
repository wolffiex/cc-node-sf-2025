#!/usr/bin/env python3

import os
import pty
import select
import subprocess
import sys
from pathlib import Path

def demo_fifo_communication():
    """Demonstrate named pipe creation and usage"""
    fifo_path = Path('/tmp/shell_demo_fifo')
    
    # Clean up any existing FIFO
    if fifo_path.exists():
        fifo_path.unlink()
    
    # Create FIFO natively
    os.mkfifo(fifo_path)
    print(f"Created FIFO at {fifo_path}")
    
    # Fork to demonstrate IPC
    if os.fork() == 0:
        # Child: write to FIFO
        with open(fifo_path, 'w') as fifo:
            fifo.write("Hello from child process via FIFO!\n")
        sys.exit(0)
    else:
        # Parent: read from FIFO (this would block in Node!)
        with open(fifo_path, 'r') as fifo:
            message = fifo.read()
            print(f"Received via FIFO: {message.strip()}")
    
    # Cleanup
    fifo_path.unlink()

def create_interactive_shell():
    """Create a proper interactive shell with PTY that supports aliases"""
    
    # Create a pseudo-terminal
    # parent_fd: used by parent process to read/write to the terminal
    # child_fd: connected to stdin/stdout/stderr of the child process
    parent_fd, child_fd = pty.openpty()
    
    # Launch bash in interactive mode with proper environment
    proc = subprocess.Popen(
        ['bash', '-i'],  # -i for interactive (enables aliases!)
        stdin=child_fd,
        stdout=child_fd,
        stderr=child_fd,
        preexec_fn=os.setsid,  # setsid = "set session ID" - creates new session/process group
        env={**os.environ, 'PS1': '$ '}  # Simple prompt
    )
    
    # Close child FD in parent
    os.close(child_fd)
    
    return proc, parent_fd

def main():
    print("Python Shell Integration Demo")
    print("=" * 40)

    # 1. Demo FIFO communication
    print("\n1. Testing FIFO communication:")
    demo_fifo_communication()

    
    # 2. Create interactive shell with PTY
    print("\n2. Creating interactive shell with alias support:")
    proc, parent_fd = create_interactive_shell()
    
    try:
        # Send a command to create an alias
        os.write(parent_fd, b"alias hello='echo Hello from alias!'\n")
        os.write(parent_fd, b"hello\n")  # This will work!
        os.write(parent_fd, b"sleep 2\n")
        os.write(parent_fd, b"echo 'Direct command'\n")
        os.write(parent_fd, b"exit\n")
        
        # Read output with proper select() handling
        print("\nShell output:")
        print("-" * 40)
        
        while proc.poll() is None:
            # Use select for non-blocking I/O
            r, _, _ = select.select([parent_fd], [], [], 0.1)
            if r:
                output = os.read(parent_fd, 1024)
                print(output.decode('utf-8', errors='replace'), end='')
    
    finally:
        os.close(parent_fd)
        
        # Ensure process is terminated
        if proc.poll() is None:
            proc.terminate()
            proc.wait()
    
    print("\n" + "=" * 40)
    print("Demo complete! Aliases worked in the interactive shell.")

if __name__ == '__main__':
    main()
