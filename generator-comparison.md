# Async Generator Composition: JavaScript vs Python

## The Problem

Both programs do the same thing:
1. Stream data asynchronously (simulating API calls)
2. Split strings into characters
3. Transform to uppercase
4. Add typing delay
5. Output to console

## Key Differences

### 1. Natural Composition vs Manual Management

**JavaScript**: Generators compose naturally
```javascript
const pipeline = slowType(upper(chars(streamData())));
```

**Python**: Must track each generator for cleanup
```python
stream_gen = stream_data()
chars_gen = chars(stream_gen)
upper_gen = upper(chars_gen)
pipeline = slow_type(upper_gen)
```

### 2. yield* vs Manual Iteration

**JavaScript**: `yield*` delegation works with async
```javascript
async function* chars(strings) {
  for await (const s of strings) {
    yield* s;  // Elegant delegation
  }
}
```

**Python**: Must manually iterate
```python
async def chars(strings):
    async for s in strings:
        for c in s:  # Can't use yield from!
            yield c
```

### 3. Automatic vs Manual Cleanup

**JavaScript**: Garbage collection handles cleanup
```javascript
for await (const c of pipeline) {
  process.stdout.write(c);
}
// No cleanup needed - GC handles it
```

**Python**: Must explicitly close each generator
```python
try:
    async for c in pipeline:
        print(c, end='', flush=True)
finally:
    # Manual cleanup required for EACH generator
    await pipeline.aclose()
    await upper_gen.aclose()
    await chars_gen.aclose()
    await stream_gen.aclose()
```

### 4. Top-Level Execution

**JavaScript**: Simple async function call
```javascript
main().catch(console.error);
```

**Python**: Requires event loop ceremony
```python
if __name__ == '__main__':
    asyncio.run(main())
```

### 5. Error Handling Implications

**JavaScript**: Errors propagate naturally through the pipeline
- If `streamData()` throws, it bubbles up through the entire chain
- No cleanup needed - generators are GC'd

**Python**: Complex error handling
- Must ensure all generators are closed even on error
- Risk of resource leaks if cleanup is missed
- Each generator in the chain needs careful handling

## Why This Matters

The JavaScript version is:
- **Shorter**: ~40 lines vs ~55 lines
- **Safer**: No resource leaks possible
- **Clearer**: The pipeline composition is obvious
- **More maintainable**: Adding/removing stages is trivial

The Python version requires:
- **Manual resource tracking**: Must remember every generator
- **Explicit cleanup**: Easy to forget and leak resources
- **More boilerplate**: Event loop, cleanup blocks
- **Careful composition**: Can't use natural delegation patterns

This exemplifies the broader issue: Python's async generators feel like a retrofit, while JavaScript's feel native to the language.