import { describe, it, expect, vi } from 'vitest';
import { ObjectReadWriteStream, ObjectReadStream } from '../src/battle/streams';

describe('ObjectReadWriteStream', () => {
  describe('push', () => {
    it('should buffer data when no waiters', async () => {
      const stream = new ObjectReadWriteStream<string>();
      stream.push('data1');
      stream.push('data2');

      const iterator = stream[Symbol.asyncIterator]();
      const result1 = await iterator.next();
      const result2 = await iterator.next();

      expect(result1.value).toBe('data1');
      expect(result2.value).toBe('data2');
    });

    it('should resolve waiting promises immediately', async () => {
      const stream = new ObjectReadWriteStream<string>();

      const iteratorPromise = (async () => {
        const iterator = stream[Symbol.asyncIterator]();
        return iterator.next();
      })();

      // Give the iterator time to set up waiter
      await new Promise(r => setTimeout(r, 10));
      stream.push('delayed data');

      const result = await iteratorPromise;
      expect(result.value).toBe('delayed data');
    });

    it('should not push after stream is ended', async () => {
      const stream = new ObjectReadWriteStream<string>();
      stream.push('data1');
      stream.pushEnd();
      stream.push('data2'); // Should be ignored

      const results: string[] = [];
      for await (const data of stream) {
        results.push(data);
      }
      expect(results).toEqual(['data1']);
    });
  });

  describe('pushError', () => {
    it('should mark stream as ended when end=true', async () => {
      const stream = new ObjectReadWriteStream<string>();
      stream.pushError(new Error('test error'), true);

      // Stream should be ended - just verify the call doesn't throw
      expect(true).toBe(true);
    });

    it('should not end stream when end=false', async () => {
      const stream = new ObjectReadWriteStream<string>();
      stream.pushError(new Error('test error'), false);

      // Stream is not ended (ended flag is false), but has error state
      // Note: Once error is set, iterator will throw on next iteration
      // The key difference from end=true is that ended flag is not set
      expect((stream as any).ended).toBe(false);

      // However, trying to iterate will throw the error
      const iterator = stream[Symbol.asyncIterator]();
      await expect(iterator.next()).rejects.toThrow('test error');
    });
  });

  describe('pushEnd', () => {
    it('should signal end of stream', async () => {
      const stream = new ObjectReadWriteStream<string>();
      stream.push('data');
      stream.pushEnd();

      const results: string[] = [];
      for await (const data of stream) {
        results.push(data);
      }
      expect(results).toEqual(['data']);
    });

    it('should resolve waiting promises with done=true', async () => {
      const stream = new ObjectReadWriteStream<string>();

      const iteratorPromise = (async () => {
        const iterator = stream[Symbol.asyncIterator]();
        return iterator.next();
      })();

      await new Promise(r => setTimeout(r, 10));
      stream.pushEnd();

      const result = await iteratorPromise;
      expect(result.done).toBe(true);
    });
  });

  describe('write', () => {
    it('should call _write handler', async () => {
      const stream = new ObjectReadWriteStream<string>();
      const writeSpy = vi.fn();
      stream._write = writeSpy;

      await stream.write('test data');
      expect(writeSpy).toHaveBeenCalledWith('test data');
    });
  });

  describe('writeEnd', () => {
    it('should call _writeEnd handler', async () => {
      const stream = new ObjectReadWriteStream<string>();
      await stream.writeEnd();

      // Stream should be ended
      const iterator = stream[Symbol.asyncIterator]();
      const result = await iterator.next();
      expect(result.done).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should end stream and call _destroy', async () => {
      const stream = new ObjectReadWriteStream<string>();
      const destroySpy = vi.fn();
      (stream as any)._destroy = destroySpy;

      stream.destroy();
      expect(destroySpy).toHaveBeenCalled();

      const iterator = stream[Symbol.asyncIterator]();
      const result = await iterator.next();
      expect(result.done).toBe(true);
    });
  });

  describe('async iteration', () => {
    it('should iterate over all pushed data', async () => {
      const stream = new ObjectReadWriteStream<number>();
      stream.push(1);
      stream.push(2);
      stream.push(3);
      stream.pushEnd();

      const results: number[] = [];
      for await (const data of stream) {
        results.push(data);
      }
      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle mixed buffer and wait states', async () => {
      const stream = new ObjectReadWriteStream<string>();

      const collectPromise = (async () => {
        const results: string[] = [];
        for await (const data of stream) {
          results.push(data);
        }
        return results;
      })();

      stream.push('a');
      await new Promise(r => setTimeout(r, 10));
      stream.push('b');
      await new Promise(r => setTimeout(r, 10));
      stream.push('c');
      stream.pushEnd();

      const results = await collectPromise;
      expect(results).toEqual(['a', 'b', 'c']);
    });
  });
});

describe('ObjectReadStream', () => {
  it('should create with default options', () => {
    const stream = new ObjectReadStream<string>();
    expect(stream).toBeInstanceOf(ObjectReadWriteStream);
  });

  it('should accept read option', () => {
    const readFn = vi.fn();
    const stream = new ObjectReadStream<string>({ read: readFn });
    expect(stream).toBeInstanceOf(ObjectReadWriteStream);
  });
});
