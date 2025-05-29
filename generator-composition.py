#!/usr/bin/env python3

import asyncio
from typing import AsyncIterator, AsyncGenerator

# Simulated async data source
async def stream_data() -> AsyncGenerator[str, None]:
    messages = ['hello', 'world', 'from', 'async', 'generators']
    for msg in messages:
        # Simulate network delay
        await asyncio.sleep(0.1)
        yield msg
        yield " "

# Split strings into individual characters
async def chars(strings: AsyncIterator[str]) -> AsyncGenerator[str, None]:
    async for s in strings:
        # Can't use yield from with async generators!
        for c in s:
            yield c

# Transform characters to uppercase
async def upper(chars: AsyncIterator[str]) -> AsyncGenerator[str, None]:
    async for c in chars:
        yield c.upper()

# Add delays between characters for effect
async def slow_type(chars: AsyncIterator[str], seconds: float = 0.05) -> AsyncGenerator[str, None]:
    async for c in chars:
        yield c
        await asyncio.sleep(seconds)

# Main - compose all the generators
async def main():
    print('Streaming characters:\n')
    
    # Composition requires explicit generator management
    stream_gen = stream_data()
    chars_gen = chars(stream_gen)
    upper_gen = upper(chars_gen)
    pipeline = slow_type(upper_gen)
    
    try:
        # Consume the pipeline
        async for c in pipeline:
            print(c, end='', flush=True)
    finally:
        # Must explicitly close all generators!
        await pipeline.aclose()
        await upper_gen.aclose()
        await chars_gen.aclose()
        await stream_gen.aclose()
    
    print('\n\nDone!')

# Can't just call main() - need event loop
if __name__ == '__main__':
    asyncio.run(main())
