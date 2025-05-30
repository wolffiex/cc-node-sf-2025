# Plain Text, Rich Experience: Lessons from Building Claude Code

Talk for Node.js SF Meetup about the technical decisions and lessons learned building [Claude Code](https://claude.ai/code), Anthropic's official CLI for Claude.

## Abstract

This talk explores the architectural decisions behind Claude Code, focusing on three key areas:
- Why async generators are the perfect abstraction for LLM streaming
- JavaScript vs Python trade-offs for CLI development
- Client-side storage pitfalls and solutions

## Key Takeaways

1. **Async Generators = Natural Agent Framing**: Streaming tokens → content blocks → tool calls map perfectly to generator composition
2. **Language Choice Matters**: Beyond syntax preferences, ecosystem maturity drives real-world developer experience
3. **Client-Side ≠ Server-Side**: What works in production servers often fails catastrophically on user machines

## Topics Covered

- Async generator patterns for streaming LLM responses
- Startup performance comparison (Python: 47ms, Bun compiled: 3ms)
- POSIX integration challenges in Node.js
- Native dependency hell with SQLite/better-sqlite3
- Package management complexity across ecosystems

## Resources

- [Talk outline](talk.md)
- [Claude Code](https://claude.ai/code)
- [Anthropic API Documentation](https://docs.anthropic.com/en/api/messages)

## About

Presented at Node.js SF Meetup by the Claude Code team, sharing practical lessons from building a high-performance CLI tool used by thousands of developers daily.