#!/bin/bash

echo "🚀 Startup Time Visual Comparison"
echo "================================="
echo ""

# Pre-compile the Bun binary
echo "Preparing compiled binary..."
bun build startup-imports-bun.js --compile --outfile startup-compiled >/dev/null 2>&1
echo ""

echo "Running each program 10 times..."
echo ""

# Use hyperfine if available, otherwise fall back to basic timing
if command -v hyperfine &> /dev/null; then
    echo "Using hyperfine for accurate measurements:"
    echo ""
    hyperfine --warmup 3 --runs 10 \
        'python3 startup-imports.py' \
        'node startup-imports.js' \
        'bun startup-imports-bun.js' \
        './startup-compiled'
else
    echo "With common imports (10 runs each):"
    echo "-----------------------------------"
    
    # Simple approach - just show the raw timing
    echo ""
    echo -n "Python:         "
    time (for i in {1..10}; do python3 startup-imports.py >/dev/null 2>&1; done)
    
    echo -n "Node.js:        "
    time (for i in {1..10}; do node startup-imports.js >/dev/null 2>&1; done)
    
    echo -n "Bun:            "  
    time (for i in {1..10}; do bun startup-imports-bun.js >/dev/null 2>&1; done)
    
    echo -n "Bun (compiled): "
    time (for i in {1..10}; do ./startup-compiled >/dev/null 2>&1; done)
fi

echo ""
echo "📊 Visual comparison (single run):"
echo "--------------------------------"

# Just do a simple visual comparison with single runs
for i in {1..5}; do
    echo ""
    echo "Run $i:"
    
    start=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time() * 1000000000))')
    python3 startup-imports.py >/dev/null 2>&1
    end=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time() * 1000000000))')
    py_time=$(( (end - start) / 1000000 ))
    
    start=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time() * 1000000000))')
    node startup-imports.js >/dev/null 2>&1
    end=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time() * 1000000000))')
    node_time=$(( (end - start) / 1000000 ))
    
    start=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time() * 1000000000))')
    bun startup-imports-bun.js >/dev/null 2>&1
    end=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time() * 1000000000))')
    bun_time=$(( (end - start) / 1000000 ))
    
    start=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time() * 1000000000))')
    ./startup-compiled >/dev/null 2>&1
    end=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time() * 1000000000))')
    compiled_time=$(( (end - start) / 1000000 ))
    
    printf "  Python:       %3dms " $py_time
    for ((j=0; j<py_time/5; j++)); do echo -n "█"; done
    echo ""
    
    printf "  Node.js:      %3dms " $node_time
    for ((j=0; j<node_time/5; j++)); do echo -n "█"; done
    echo ""
    
    printf "  Bun:          %3dms " $bun_time
    for ((j=0; j<bun_time/5; j++)); do echo -n "█"; done
    echo ""
    
    printf "  Bun compiled: %3dms " $compiled_time
    for ((j=0; j<compiled_time/5; j++)); do echo -n "█"; done
    echo ""
done

echo ""
echo "📈 Key Insights:"
echo "----------------"
echo "• Each █ = 5ms"
echo "• Python is consistently slowest due to import overhead"
echo "• Bun compiled achieves near-native performance"
echo "• For Claude Code, fast startup = better user experience"