# Plain Text, Rich Experience: Lessons from Building Claude Code

## Overview

- Introducing Claude Code
- JavaScript Async Generators
- Python vs JavaScript for a CLI
- Client-side storage lessons learned

## Claude Code

- Demo
- [Unix Philosophy](https://cscie2x.dce.harvard.edu/hw/ch01s06.html)
- TypeScript, Anthropic API, Tool Calling
- Thinnest possible wrapper over the model

## 1. Async Generators: Streaming LLM Responses

- **Latency**: LLMs are slow, so buffering complete responses results in sub-par UX
- **Natural streaming pattern**: [LLM APIs stream tokens](https://docs.anthropic.com/en/docs/build-with-claude/streaming#content-block-delta-types) incrementally, and async generators provide a perfect abstraction for this pattern
- **Memory efficiency**: Process tokens as they arrive without buffering entire responses
- **Composability**: Easy to transform, filter, or enhance streams with generator functions

## Benefits to Claude Code

- Immediate user feedback as responses stream
- Reasonable cancellation semantics without losing everything
- Easy integration with terminal rendering libraries
- Natural backpressure

## 2. JavaScript/TypeScript vs Python for CLI Development

Write a program that will:
1. Stream data asynchronously (simulating API calls)
2. Split strings into characters
3. Transform to uppercase
4. Add typing delay
5. Output to console

## 1. JS advantages

1. Generator composition
2. `yield*`
3. Cleanup
4. Top-level execution
4. Error propagation


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

Python's async generators are a retrofit, JavaScript has always been evented

## Packaging
- TODO

### POSIX Integration
- TODO

### Start-up time
- TODO

## 3. SQLite Challenges in Client-Side Applications

### Initial Appeal
- **Zero configuration**: No server setup required
- **Single file storage**: Easy backup and portability
- **ACID compliance**: Reliable transactions
- **Good performance**: For single-user scenarios

### Challenges Encountered

#### 1. Concurrent Access Issues
- Multiple CLI instances can cause database locks
- Write operations block readers in default mode
- WAL mode helps but isn't perfect for all scenarios

#### 2. File System Dependencies
- Network file systems (NFS, SMB) cause corruption
- Cloud sync services (Dropbox, iCloud) create conflicts
- Different OS file locking behaviors

#### 3. Migration Complexity
- Schema changes require careful orchestration
- No built-in migration tools like in server databases
- Backward compatibility harder to maintain

#### 4. Performance Limitations
- Large datasets slow down without proper indexing
- Full-text search less sophisticated than dedicated engines
- Query optimization tools are limited

### Lessons Learned
1. **Design for single-writer**: Enforce single CLI instance or use file locks
2. **Use WAL mode**: Better concurrency but monitor checkpoint behavior
3. **Regular backups**: Implement automatic backup strategies
4. **Consider alternatives**: For heavy concurrent use, consider client-server DB
5. **Abstract data layer**: Make it easy to swap storage backends

### Alternative Approaches Considered
- **JSON files**: Simpler but lack ACID properties
- **LevelDB**: Better for key-value patterns
- **Client-server DB**: PostgreSQL/MySQL for true multi-user support
- **Hybrid approach**: SQLite for cache, server for shared state

## Conclusion
Building Claude Code has provided valuable insights into modern CLI development. The choice of async generators for streaming, JavaScript/TypeScript for implementation, and SQLite for storage each brought unique benefits and challenges that shaped the final product.

These experiences highlight the importance of:
- Choosing patterns that align with your problem domain (streaming → generators)
- Evaluating language ecosystems holistically (not just syntax preferences)
- Understanding storage trade-offs early in the design process
