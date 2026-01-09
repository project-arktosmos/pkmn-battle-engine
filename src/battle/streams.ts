/**
 * Streams - Async stream utilities for battle communication
 *
 * Provides async iterator-based stream classes for managing battle I/O.
 */

/**
 * Base class for readable/writable streams
 */
export class ObjectReadWriteStream<T> implements AsyncIterable<T> {
  private buffer: T[] = [];
  private waiters: Array<(value: IteratorResult<T>) => void> = [];
  private errorWaiters: Array<(error: Error) => void> = [];
  private ended = false;
  private error: Error | null = null;
  protected atEOF = false;

  /**
   * Push data to the stream
   */
  push(data: T): void {
    if (this.ended) return;

    if (this.waiters.length > 0) {
      const waiter = this.waiters.shift()!;
      waiter({ value: data, done: false });
    } else {
      this.buffer.push(data);
    }
  }

  /**
   * Push an error to the stream
   */
  pushError(error: Error, end = false): void {
    this.error = error;
    if (end) {
      this.ended = true;
      this.atEOF = true;
    }

    // Reject all waiting promises
    for (const waiter of this.errorWaiters) {
      waiter(error);
    }
    this.errorWaiters = [];

    // Also resolve pending reads with error
    for (const waiter of this.waiters) {
      waiter({ value: undefined as any, done: true });
    }
    this.waiters = [];
  }

  /**
   * Signal end of stream
   */
  pushEnd(): void {
    this.ended = true;
    this.atEOF = true;

    // Resolve all waiting promises
    for (const waiter of this.waiters) {
      waiter({ value: undefined as any, done: true });
    }
    this.waiters = [];
  }

  /**
   * Write data to the stream (to be overridden)
   */
  async write(data: string): Promise<void> {
    this._write(data);
  }

  /**
   * Internal write handler (public for dynamic assignment)
   */
  _write(_data: string): void {
    // Override in subclass
  }

  /**
   * Signal end of writes
   */
  async writeEnd(): Promise<void> {
    this._writeEnd();
  }

  /**
   * Internal write end handler
   */
  protected _writeEnd(): void {
    this.pushEnd();
  }

  /**
   * Destroy the stream
   */
  destroy(): void {
    this._destroy();
    this.pushEnd();
  }

  /**
   * Internal destroy handler
   */
  protected _destroy(): void {
    // Override in subclass
  }

  /**
   * Async iterator implementation
   */
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    while (true) {
      if (this.error) {
        throw this.error;
      }

      if (this.buffer.length > 0) {
        yield this.buffer.shift()!;
      } else if (this.ended) {
        return;
      } else {
        // Wait for data
        const result = await new Promise<IteratorResult<T>>((resolve, reject) => {
          this.waiters.push(resolve);
          this.errorWaiters.push(reject);
        });

        if (result.done) {
          return;
        }
        yield result.value;
      }
    }
  }
}

/**
 * Read-only stream
 */
export class ObjectReadStream<T> extends ObjectReadWriteStream<T> {
  constructor(options: { read?: () => void } = {}) {
    super();
    if (options.read) {
      // Custom read implementation
    }
  }
}
