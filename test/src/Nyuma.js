const Nyuma = require('../../src/Nyuma');
const Exponential = require('../../src/strategies/Exponential');
const Fibonacci = require('../../src/strategies/Fibonacci');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const { expect } = chai;

describe('Nyuma', () => {
  it('should retry several time', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10
    });
    let count = 0;

    await nyuma.start(() => {
      if (count < 2) {
        count++;
        throw new Error('Try again');
      }
    });

    expect(count).to.equal(2);
  });

  it('should return the callback result', async () => {
    const nyuma = new Nyuma({
      initialDelay: 20
    });

    const result = await nyuma.start(() => {
      return 'someValue';
    });

    expect(result).to.equal('someValue');
  });

  it('should follow delay exponential strategy', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10,
      strategy: new Exponential({ factor: 3 })
    });

    const start = Date.now();
    let end;
    await nyuma.start((count) => {
      if (count < 3) {
        throw new Error('Try again');
      }
      end = Date.now();
    });

    // expect 130 but setTimeout isn't that precise
    expect(end - start).to.be.within(115, 145);
  });

  it('should follow delay fibonacci strategy', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10,
      strategy: new Fibonacci()
    });

    const start = Date.now();
    let end;

    await nyuma.start((count, delay) => {
      if (count < 4) {
        throw new Error('Try again');
      }
      end = Date.now();
    });

    // expect 70 but setTimeout isn't that precise
    expect(end - start).to.be.within(45, 85);
  });

  it('should return last error when max retries is reached', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10,
      maxRetries: 2
    });
    let finalCount;

    const error = new Error('Try again');
    const promise = nyuma.start((retryCount) => {
      finalCount = retryCount;
      if (retryCount < 10) {
        throw error;
      }
    });

    await expect(promise).to.eventually.be.rejectedWith(error);
    expect(finalCount).to.equal(2);
  });

  it('should trigger fail hook when max retries is reached', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10,
      maxRetries: 2
    });
    let capturedFailInfo;

    nyuma.failHook((failInfo) => {
      capturedFailInfo = failInfo;
    });

    try {
      await nyuma.start((retryCount) => {
        if (retryCount < 10) {
          throw new Error('Try again');
        }
      });
    } catch (err) {}

    expect(capturedFailInfo).to.deep.include({
      reason: 'Max retries reached',
      retryCount: 2,
      lastDelay: 20
    });
  });

  it('should cap delay when max delay is reached', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10,
      strategy: new Exponential({ factor: 3 }),
      maxDelay: 40
    });
    let captuedLastDelay;

    await nyuma.start((retryCount, delay) => {
      if (retryCount < 4) {
        throw new Error('Try again');
      }
      captuedLastDelay = delay;
    });

    expect(captuedLastDelay).to.equal(40);
  });

  it('should return last error when max time is reached', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10,
      maxTime: 100
    });

    const error = new Error('Try again');
    const promise = nyuma.start((retryCount) => {
      if (retryCount < 10) {
        throw error;
      }
    });

    await expect(promise).to.eventually.be.rejectedWith(error);
  });

  it('should trigger fail hook when max time is reached', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10,
      maxTime: 100
    });
    let capturedFailInfo;

    nyuma.failHook((failInfo) => {
      capturedFailInfo = failInfo;
    });

    try {
      await nyuma.start((retryCount, delay) => {
        if (retryCount < 10) {
          throw new Error('Try again');
        }
      });
    } catch (err) {}

    expect(capturedFailInfo).to.deep.include({
      reason: 'Max time reached',
      retryCount: 3,
      lastDelay: 80
    });
  });

  it('should return default error when 1st try exceed max time', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10,
      maxTime: 100
    });

    const promise = nyuma.start(() => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    });

    await expect(promise).to.eventually.be.rejectedWith(
      'First try reached max time'
    );
  });

  it('should return custom error when 1st try exceed max time', async () => {
    const nyuma = new Nyuma({
      initialDelay: 10,
      maxTime: 100,
      maxTimeError: 'Custom max time reached error'
    });

    const promise = nyuma.start(() => {
      return new Promise(resolve => setTimeout(resolve, 1000));
    });

    await expect(promise).to.eventually.be.rejectedWith(
      'Custom max time reached error'
    );
  });
});
