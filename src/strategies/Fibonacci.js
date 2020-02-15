module.exports = class Fibonacci {
  constructor () {
    this.previous = 0;
    this.current = 0;
  }

  next () {
    const next = this.previous + (this.current || 1);
    this.previous = this.current;
    this.current = next;

    return next;
  }
};
