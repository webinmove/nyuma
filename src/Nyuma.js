const Exponential = require('./strategies/Exponential');

module.exports = class Nyuma {
  constructor ({
    strategy = new Exponential(),
    initialDelay = 0,
    maxDelay = Infinity,
    maxRetries = Infinity,
    maxTime = Infinity,
    maxTimeError = 'First try reached max time'
  } = {}) {
    if (initialDelay <= 0) {
      throw new Error('Inital delay must be greater than 0');
    }

    this.strategy = strategy;
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.maxRetries = maxRetries;
    this.maxTime = maxTime;
    this.maxTimeError = maxTimeError;

    this.retryCount = 0;
    this.delay = 0;
    this.lastError = null;
    this.onFail = () => {};
  }

  failHook (onFail) {
    this.onFail = onFail;

    return this;
  }

  getDuration () {
    if (!this.startTime) {
      return 0;
    }

    return Date.now() - this.startTime;
  }

  start (fn) {
    if (this.startTime) {
      throw new Error('Nyuma already started');
    }

    this.fn = fn;
    this.stop = false;
    this.startTime = Date.now();

    return new Promise((resolve, reject) => {
      let timer;

      if (this.maxTime !== Infinity) {
        timer = setTimeout(() => {
          this.stop = true;
          const error = this.lastError ||
            new Error(this.maxTimeError);

          this.onFail({
            reason: 'Max time reached',
            retryCount: this.retryCount,
            lastDelay: this.delay,
            duration: this.getDuration()
          });

          reject(error);
        }, this.maxTime);
      }

      this.exec(fn)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          if (timer) {
            clearTimeout(timer);
          }
        });
    });
  }

  async exec () {
    try {
      return await this.fn(this.retryCount, this.delay);
    } catch (err) {
      if (this.stop) {
        return;
      }
      this.lastError = err;
      if (this.retryCount >= this.maxRetries) {
        this.onFail({
          reason: 'Max retries reached',
          retryCount: this.retryCount,
          lastDelay: this.delay,
          duration: this.getDuration()
        });

        throw this.lastError;
      }

      const strategyDelay = this.initialDelay * this.strategy.next();
      this.delay = Math.min(strategyDelay, this.maxDelay);

      await new Promise(resolve => setTimeout(resolve, this.delay));
      this.retryCount++;

      return this.exec();
    }
  }
};
