# Nyuma

[![Continuous Integration](https://github.com/webinmove/nyuma/workflows/Continuous%20Integration/badge.svg?branch=master)](https://github.com/webinmove/nyuma/actions)
[![Coverage Status](https://coveralls.io/repos/github/webinmove/nyuma/badge.svg?branch=refs/heads/master)](https://coveralls.io/github/webinmove/nyuma?branch=refs/heads/master)
[![npm version](https://img.shields.io/npm/v/@webinmove/nyuma.svg)](https://www.npmjs.com/package/@webinmove/nyuma)
[![Dependency Status](https://david-dm.org/webinmove/nyuma.svg)](https://david-dm.org/webinmove/nyuma)

## Description

Nyuma means "back" in Swahili.
It is an async retry implementation with fibonacci or exponential strategy.

## Motivation

All the backoff implementation I came accross where missing on key feature: a maximum overall time option.

## Installation

```sh
$ npm install @webinmove/nyuma
```

## Usage

### Basic real life

```js
const { fibonacci } = require('@webinmove/nyuma');
const fetch = require('node-fetch');

const main = async () => {
  const nyuma = fibonacci({ initialDelay: 100, maxTime: 60000 });

  try {
    // Here we'll only retry on real network error
    const response = await nyuma.start(() =>
      fetch('https://api.github.com/repos/webinmove/nyuma')
    );
    console.log(await response.json());
  } catch (err) {
    // Couldn't get the response in less than a minute...
    console.error(err);
  }
};

main();
```

### With another strategy and more options

```js
const { exponential } = require('@webinmove/nyuma');
const fetch = require('node-fetch');

const main = async () => {
  const nyuma = exponential({
    initialDelay: 100,
    maxDelay: 10000,
    maxRetries: 3,
    maxTime: 60000,
    maxTimeError: 'First fetch was too long',
    factor: 3
  });

  try {
    const body = await nyuma
      .failHook(({ reason, retryCount, lastDelay, duration }) =>
        console.log({ reason, retryCount, lastDelay, duration })
      )
      .start(async () => {
        const response = await fetch('https://api.github.com/repos/webinmove/nyuma');
        if (response.status >= 400) {
          throw new Error(`Call responded with status ${response.status}`);
        }

        return response.json();
      });

    console.log(body);
  } catch (err) {
    // Couldn't get the response in less than a minute or 5 retries...
    console.error(err);
  }
};

main();
```

### Using base classes

```js
const { Nyuma, ExponentialStrategy } = require('@webinmove/nyuma');

const fetch = require('node-fetch');

const main = async () => {
  const strategy = new ExponentialStrategy({ factor: 3 });
  const nyuma = new Nyuma({
    strategy,
    initialDelay: 100,
    maxDelay: 10000,
    maxRetries: 3,
    maxTime: 60000
  });

  nyuma.failHook(({ reason, retryCount, lastDelay, duration }) =>
    console.log({ reason, retryCount, lastDelay, duration })
  );

  try {
    const body = await nyuma.start(async () => {
      const response = await fetch('https://api.github.com/repos/webinmove/nyuma');
      if (response.status >= 400) {
        throw new Error(`Call responded with status ${response.status}`);
      }

      return response.json();
    });

    console.log(body);
  } catch (err) {
    // Couldn't get the response in less than a minute or 5 retries...
    console.error(err);
  }
};

main();
```

## API

### fibonacci(params)

Returns a Nyuma instance initialized with the fibonacci strategy and the params.

**params**

- initialDelay: delay in ms for the first retry (required)
- maxDelay: maximum delay can reach before a retry (optional, default Infinity)
- maxRetries: maximum retries before throwing the last error encounter (optional, default Infinity)
- maxTime: maximum time for the first try and all retries before throwing the last error encounter or a specific error if the first try was too long (optional, default Infinity)
- maxTimeError: error message in case the first try was too long (optional, dafault "First try reached max time")

*Note: you should specify at least a maxRetries or a maxTime*

### exponential(params)

Returns a Nyuma instance initialized with the exponential strategy and the params.

**params**

- factor: exponential factor used to compute the delays (optional, default 2)
- initialDelay: delay in ms for the first retry (required)
- maxDelay: maximum delay can reach before a retry (optional, default Infinity)
- maxRetries: maximum retries before throwing the last error encounter (optional, default Infinity)
- maxTime: maximum time for the first try and all retries before throwing the last error encounter or a specific error if the first try was too long (optional, default Infinity)
- maxTimeError: error message in case the first try was too long (optional, dafault "First try reached max time")

*Note: you should specify at least a maxRetries or a maxTime*

### Class Nyuma

#### constructor(params)

Returns a Nyuma instance initialized with the params.

**params**

- strategy: a strategy instance (optional, default exponentialStrategy)
- initialDelay: delay in ms for the first retry (required)
- maxDelay: maximum delay can reach before a retry (optional, default Infinity)
- maxRetries: maximum retries before throwing the last error encounter (optional, default Infinity)
- maxTime: maximum time for the first try and all retries before throwing the last error encounter or a specific error if the first try was too long (optional, default Infinity)
- maxTimeError: error message in case the first try was too long (optional, dafault "First try reached max time")

*Note: you should specify at least a maxRetries or a maxTime*

#### start(fn)

Start the retry process retruning a promise of the fn result.

- fn: a function that will be retry until sucess or a maximum reached (required)

When called this function will have 2 arguments:

- retryCount: number of retry already done
- lastDelay: delay between the previous retry and the current

**exemple**:

```js
const { Nyuma, FibonacciStrategy } = require('@webinmove/nyuma');

const main = async () => {
  const strategy = new FibonacciStrategy();
  const nyuma = new Nyuma({ strategy, initialDelay: 10, maxRetries: 10 });

  await nyuma.start(async (retryCount, lastDelay) => {
    console.log(`${retryCount} ${lastDelay} ms`);
    throw new Error('Try again!');
  }
  );
};

main();
```

will output:

```
0 0 ms
1 10 ms
2 10 ms
3 20 ms
4 30 ms
5 50 ms
6 80 ms
7 130 ms
8 210 ms
9 340 ms
10 550 ms
(node:51869) UnhandledPromiseRejectionWarning: Error: Try again!
```

#### failHook(fn)

Set a function on fail hook function.

- fn: a function that will be called on fail.

When called this function will have 1 argument:

- params: object containing
  - reason: string with the fail reason (e.g. "Maximum retry reached" or "Maximum time reached")
  - retryCount: number of retry done until fail
  - lastDelay: last retry delay in ms
  - duration: overall duration before fail in ms

### Class ExponentialStrategy

#### constructor(params)

Returns a ExponentialStrategy instance initialized with the params.

**params**

- factor: the multiplicator factor, should be >= 1 (optional, default 2)

#### next()

Retruns the next iteration of the exponential sequence (e.g.: 1, 2, 4, 8, ...).

### Class FibonacciStrategy

#### constructor()

Returns a FibonacciStrategy instance initialized with the params.

#### next()

Retruns the next iteration of the fibonacci sequence (e.g.: 1, 1, 2, 3, 5, 8, ...).


## Npm scripts

### Running code formating

```sh
$ npm run format
```

### Running tests

```sh
$ npm run test:spec
```

### Running lint tests

```sh
$ npm run test:lint
```

### Running coverage tests

```sh
$ npm run test:cover
```

This will create a coverage folder with all the report in `coverage/index.html`

### Running all tests

```sh
$ npm test
```

*Note: that's the one you want to use most of the time*

## Reporting bugs and contributing

If you want to report a bug or request a feature, please open an issue.
If want to help us improve nyuma, fork and make a pull request.
Please use commit format as described [here](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines).
And don't forget to run `npm run format` before pushing commit.
