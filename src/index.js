const Nyuma = require('./Nyuma');
const ExponentialStrategy = require('./strategies/Exponential');
const FibonacciStrategy = require('./strategies/Fibonacci');

module.exports.Nyuma = Nyuma;
module.exports.ExponentialStrategy = ExponentialStrategy;
module.exports.FibonacciStrategy = FibonacciStrategy;

module.exports.exponential = ({
  factor,
  initialDelay,
  maxDelay,
  maxRetries,
  maxTime,
  maxTimeError
}) => {
  const strategy = new ExponentialStrategy({ factor });

  return new Nyuma({
    strategy,
    initialDelay,
    maxDelay,
    maxRetries,
    maxTime,
    maxTimeError
  });
};

module.exports.fibonacci = ({
  initialDelay,
  maxDelay,
  maxRetries,
  maxTime,
  maxTimeError
}) => {
  const strategy = new FibonacciStrategy();

  return new Nyuma({
    strategy,
    initialDelay,
    maxDelay,
    maxRetries,
    maxTime,
    maxTimeError
  });
};
