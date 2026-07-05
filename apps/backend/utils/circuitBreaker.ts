export class CircuitOpenError extends Error {
  constructor(message = 'Circuit is open — failing fast without calling the upstream service.') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

type CircuitState = 'closed' | 'open' | 'half-open';


export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(
    private readonly threshold = 5,
    private readonly cooldownMs = 60_000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.cooldownMs) {
        this.state = 'half-open';
      } else {
        throw new CircuitOpenError();
      }
    }

    try {
      const result = await fn();
      this.state = 'closed';
      this.consecutiveFailures = 0;
      return result;
    } catch (err) {
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= this.threshold) {
        this.state = 'open';
        this.openedAt = Date.now();
      }
      throw err;
    }
  }

  getState() {
    return this.state;
  }
}


export const zoomApiCircuit = new CircuitBreaker(5, 60_000);
