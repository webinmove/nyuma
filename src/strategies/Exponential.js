module.exports = class ExponentialStrategy {
  constructor ({
    factor = 2
  } = {}) {
    this.factor = factor;
    this.current = 1;
  }

  next () {
    const next = this.current;
    this.current = next * this.factor;

    return next;
  }
};
