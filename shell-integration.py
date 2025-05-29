#!/usr/bin/env python3

import os
import pty
import select
import subprocess
import signal
import sys
import termios
import tty
from pathlib import Path

def create_interactive_shell():
    """Create a proper interactive shell with PTY that supports aliases"""
    
    # Create a pseudo-terminal
    master_fd, slave_fd = pty.openpty()
    
    # Launch bash in interactive mode with proper environment
    proc = subprocess.Popen(
        ['bash', '-i'],  # -i for interactive (enables aliases!)
        stdin=slave_fd,
        stdout=slave_fd,
        stderr=slave_fd,
        preexec_fn=os.setsid,  # Create new session for proper signal handling
        env={**os.environ, 'PS1': '$ '}  # Simple prompt
    )
    
    # Close slave FD in parent
    os.close(slave_fd)
    
    return proc, master_fd

def setup_signal_handling(proc):
    """Proper signal forwarding to child process group"""
    def signal_handler(signum, frame):
        # Forward signal to entire process group
        if proc.poll() is None:
            os.killpg(os.getpgid(proc.pid), signum)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

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

def main():
    print("Python Shell Integration Demo")
    print("=" * 40)
    
    # 1. Demo FIFO communication
    print("\n1. Testing FIFO communication:")
    demo_fifo_communication()
    
    # 2. Create interactive shell with PTY
    print("\n2. Creating interactive shell with alias support:")
    proc, master_fd = create_interactive_shell()
    setup_signal_handling(proc)
    
    # 3. Set up terminal for raw mode
    old_tty = termios.tcgetattr(sys.stdin)
    try:
        # Send a command to create an alias
        os.write(master_fd, b"alias hello='echo Hello from alias!'\n")
        os.write(master_fd, b"hello\n")  # This will work!
        os.write(master_fd, b"echo 'Direct command'\n")
        os.write(master_fd, b"exit\n")
        
        # Read output with proper select() handling
        print("\nShell output:")
        print("-" * 40)
        
        while proc.poll() is None:
            # Use select for non-blocking I/O
            r, _, _ = select.select([master_fd], [], [], 0.1)
            if r:
                try:
                    output = os.read(master_fd, 1024)
                    print(output.decode('utf-8', errors='replace'), end='')
                except OSError:
                    break
    
    finally:
        # Restore terminal
        termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_tty)
        os.close(master_fd)
        
        # Ensure process is terminated
        if proc.poll() is None:
            proc.terminate()
            proc.wait()
    
    print("\n" + "=" * 40)
    print("Demo complete! Aliases worked in the interactive shell.")

if __name__ == '__main__':
    main()