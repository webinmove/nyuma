const Nyuma = require('./src/Nyuma');
const ExponentialStrategy = require('./src/strategies/Exponential');
const FibonacciStrategy = require('./src/strategies/Fibonacci');

module.exports.Nyuma = Nyuma;
module.exports.ExponentialStrategy = ExponentialStrategy;
module.exports.FibonacciStrategy = FibonacciStrategy;

module.exports.exponential = ({
  initialDelay,
  maxDelay,
  maxRetries,
  maxTime,
  factor
}) => {
  const strategy = new ExponentialStrategy({ factor });

  return new Nyuma({
    strategy,
    initialDelay,
    maxDelay,
    maxRetries,
    maxTime
  });
};

module.exports.fibonacci = ({
  initialDelay,
  maxDelay,
  maxRetries,
  maxTime
}) => {
  const strategy = new FibonacciStrategy();

  return new Nyuma({
    strategy,
    initialDelay,
    maxDelay,
    maxRetries,
    maxTime
  });
};
