#!/usr/bin/env python3

# Same minimal CLI in Python
import sys
args = sys.argv[1:]
print(f"Hello from Python! Args: {', '.join(args) if args else 'none'}")
sys.exit(0)