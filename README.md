# ISAAC PRNG

ISAAC (Indirection, Shift, Accumulate, Add, Count) is a pseudo-random number generator designed for speed and encryption suitability.

The ISAAC algorithm was designed by Robert J. Jenkins Jr. in 1993, and this Node.js implementation is based on his official C implementation (https://www.burtleburtle.net/bob/rand/isaacafa.html).

## Installation

```bash
npm install isaac-prng
```

## Usage

```javascript
const ISAAC = require('isaac-prng');

const isaac = new ISAAC();

//
// Random int
//

const randomInt = isaac.random();

console.log('Random 32-bit unsigned integer between 0 and 2147483648 (exclusive):', randomInt);

//
// Random float
//

// Get the two 32-bit numbers
const random1 = isaac.random();
const random2 = isaac.random(); // Corrected typo from 'isacc.random' to 'isaac.random'
// Combine the numbers to get a 53-bit number
// The first number occupies the 21 most significant bits, the second the 32 least significant bits
const combined = (random1 * 2 ** 21) + (random2 >>> 11);
// Divide by 2^53 to get a number between 0 and 1
const randomFloat = combined / 2 ** 53;

console.log('Random 53-bit float between 0 and 1 (exclusive):', randomFloat);
```

## API

### `random(iterations = 1)`

Generates a 32-bit random integer number.

- `iterations` (optional): A positive integer specifying the number of iterations for the pseudo-random number generation (PRNG) process. Defaults to 1.
- Returns: A 32-bit random integer between 0 (0x00000000) and 2147483647 (0xFFFFFFFF).

> **_NOTE:_** The following methods can be used to have detailed control over the generation process.
> 
> ### `generate(iterations = 1)`
>
> Populates the internal buffer with pseudo-random values.
>
> - `iterations` (optional): A positive integer specifying the number of iterations for the pseudo-random number generation (PRNG) process. Defaults to 1.
>
> ### `seed(seedInput)`
>
> Initializes the internal state using the provided seed.\
> If no seed is provided, it initializes with a default value.
>
> - `seedInput` (optional): A positive number or an array of positive numbers.
>
> ### `reset()`
>
> Resets the internal state by zeroing out variables and clearing buffers.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
