#!/usr/bin/env python3

# Python with common imports - much slower!
import json
import os
import sys
import subprocess
import argparse
import logging
import datetime

args = sys.argv[1:]
print(f"Hello from Python with imports! Args: {', '.join(args) if args else 'none'}")
sys.exit(0)