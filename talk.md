# Plain Text, Rich Experience: Lessons from Building Claude Code

## Overview

- Introducing Claude Code
- Async Generators for LLM Agents
- Python vs JavaScript for a CLI Agent
- Client-side storage lessons learned

## Claude Code

- Demo
- [Unix Philosophy](https://cscie2x.dce.harvard.edu/hw/ch01s06.html)
- [Bun](https://bun.sh/docs/bundler/executables), [Anthropic API](https://github.com/anthropics/anthropic-sdk-typescript), [Tool Calling](https://docs.anthropic.com/en/api/messages#body-tools)
- Thinnest possible wrapper over the model

## Agents *Are* Async Generators

- **Latency**: LLMs are slow, so buffering complete responses results in sub-par UX
- **Natural streaming pattern**: [LLM APIs stream tokens](https://docs.anthropic.com/en/docs/build-with-claude/streaming#content-block-delta-types) incrementally, and async generators provide a perfect abstraction for this pattern
- **Natural agent framing**: Stream tokens → content blocks → tool calls, each layer composable
- **Composability**: Easy to transform, filter, or enhance streams with generator functions

## Benefits to Claude Code

- Immediate user feedback as responses stream
- Reasonable cancellation semantics without losing everything
- Easy integration with terminal rendering libraries
- Natural backpressure

## JavaScript/TypeScript vs Python for CLI Development

Write a program that will:
1. Stream data asynchronously (simulating API calls)
2. Split strings into characters
3. Transform to uppercase
4. Add typing delay
5. Output to console

## JS advantages

1. Generator composition
2. `yield*`
3. Cleanup
4. Top-level execution
5. Error propagation

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

## POSIX Integration: Shell Management

Write a program that will:
1. Create an interactive shell session that preserves user aliases
2. Run commands and capture output in real-time
3. Handle signals properly (Ctrl+C)
4. Use named pipes for IPC

## Python advantages

1. [Native PTY support](https://docs.python.org/3/library/pty.html)
2. Direct FIFO creation
3. Process group control
4. Synchronous I/O when needed

## Why This Matters

The Python version:
- **Just works**: PTY, FIFO, signals all native
- **Proper shell**: Interactive mode with aliases
- **Clean IPC**: Named pipes without blocking issues
- **Real process control**: Groups, sessions, signals

The Node.js version:
- **Requires node-pty**: Native bindings that break
- **No native FIFOs**: Must shell out to mkfifo
- **Blocks event loop**: FIFO reads freeze everything
- **Limited signals**: Can't manage process groups

Node's event-driven architecture fights POSIX's blocking I/O model

## Start-up Time

Write a program that will:
1. Import common modules (fs, path, subprocess, etc.)
2. Parse command line arguments
3. Print a message
4. Exit

Run each multiple times and visualize the results

## JS advantages

1. Browser optimization legacy
2. Bun's breakthrough performance
3. Module caching
4. Smaller runtime

## Why This Matters

### Measured startup times (with common imports):

```
Python:         47ms ████████████████
Node.js:        28ms █████████
Bun:             8ms ███
Bun compiled:    3ms █
```

Key insights:
- **15x difference**: Python (47ms) vs Bun compiled (3ms)
- **Bun's breakthrough**: 8ms uncomplied, 3ms compiled - near-native performance
- **Node.js respectable**: 28ms is still 40% faster than Python
- **Import overhead**: Python gets slower with each import

For a CLI tool like Claude Code that runs frequently, 47ms vs 3ms is the difference between feeling sluggish and feeling instant

## Packaging & Distribution

Create a CLI tool that:
1. Has multiple dependencies
2. Needs to run on different developer machines
3. Should be easy to install and update

## JS advantages

1. **Single manifest file**
   - `package.json` defines everything
   - Dependencies, scripts, metadata in one place
   - No separate requirements.txt, setup.py, pyproject.toml confusion

2. **No virtual environment maze**
   - `npm install` just works
   - No activate/deactivate dance
   - No "which Python am I using?" confusion
   - Dependencies isolated by default

3. **Version compatibility**
   - Node/npm versions are largely compatible
   - Python 2/3 split was devastating
   - Python 3.8 vs 3.11: typing syntax, match statements, walrus operators
   - JS maintains better backwards compatibility

4. **Superior package manager**
   - npm/yarn/pnpm are mature and fast
   - Lockfiles that actually work
   - Better dependency resolution
   - npm scripts for task running built-in

5. **Modern alternatives**
   - Bun: package manager + runtime + bundler
   - Single binary does everything
   - Python's uv/uvx promising but playing catch-up

## Why This Matters

For Claude Code users:
- **"npm install" vs "create venv, activate, pip install, hope it works"**
- **Single Node version vs "pyenv, conda, system Python" chaos**
- **package-lock.json ensures reproducible installs**
- **npx for one-off execution without install**

JavaScript's packaging story, while not perfect, is significantly simpler for end users. Bun takes this even further with all-in-one simplicity.

## SQLite: The Promise vs Reality

### The Promise
- **Modern ORM tooling**: Drizzle for type-safe schema management
- **Powerful migrations**: Keep code and database in perfect sync
- **Multi-process safe**: SQLite handles concurrent access
- **Zero configuration**: Just works out of the box

### The Reality: Client-Side Complexity

#### 1. Native Dependency Hell ([#978](https://github.com/anthropics/claude-code/issues/978))
- **Prebuilt binaries missing**: Not available for all platforms/architectures
- **node-gyp fallback nightmare**: Requires Python, build tools, hours of debugging
- **Package manager incompatibility**: pnpm, yarn handle native deps differently
- **Auto-update breaks bindings**: Native modules deleted, requiring manual rebuild
- **"Database unavailable"**: Complete feature loss until fixed

#### 2. Migration Hell
- **Limited visibility**: Can't debug when migrations fail on user machines
- **No rollback**: Once deployed, you're stuck with schema changes
- **Version skew**: Users on different versions = different schemas
- **Crash on inconsistency**: Migration failures brick the app

#### 3. SQLite's Quirks
- **No fine-grained locking**: Table-level locks only, readers block writers
- **Can't alter constraints**: Must recreate entire tables
- **Serialization footguns**: Defaults don't round-trip through JSON
- **Type system**: Everything is text, dates are strings

#### 4. Concurrent Access Reality
```
User opens two terminals → two CLI instances → database locked
User's Dropbox syncs → corrupted database
User on NFS mount → random failures
```

### The Better Path: Runtime Validation

**Zod + JSON files**:
- Schema validation at runtime
- Easy versioning and migration
- Human-readable/debuggable
- No lock contention
- Graceful degradation

```typescript
// With SQLite: hope migrations ran correctly
const user = db.select().from(users).where(...)

// With Zod: validate at runtime
const user = UserSchema.parse(JSON.parse(data))
```

### Lessons Learned

1. **Client-side != Server-side**: What works for servers fails on user machines
2. **Visibility matters**: Can't SSH into user's machine to fix migrations
3. **Simplicity wins**: JSON + validation > complex database
4. **Fail gracefully**: Better to lose features than crash entirely

For Claude Code, moving away from SQLite would improve reliability and debuggability while maintaining most benefits through runtime validation.

## Conclusion
Building Claude Code has provided valuable insights into modern CLI development. The choice of async generators for streaming, JavaScript/TypeScript for implementation, and SQLite for storage each brought unique benefits and challenges that shaped the final product.

These experiences highlight the importance of:
- Choosing patterns that align with your problem domain (streaming → generators)
- Evaluating language ecosystems holistically (not just syntax preferences)
- Understanding storage trade-offs early in the design process
