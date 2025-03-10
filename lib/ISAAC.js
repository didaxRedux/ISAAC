const crypto = require('crypto');

/**
 * ISAAC (Indirection, Shift, Accumulate, Add, Count) is a pseudo-random number
 * generator designed for speed and encryption suitability.
 * This implementation supports cryptographically secure random number
 * generation and state management.
 */
class ISAAC {
    /**
     * The length of the buffer used during pseudo-random generation.
     * @type {number}
     */
    static #BUFFER_LENGTH = 256;

    /**
     * A bitmask for a single byte (8 bits).
     * It is typically used to isolate or manipulate the least significant 8 bits
     * of a value in bitwise operations.
     * @type {number}
     */
    static #BYTE_MASK = 0xff;

    /**
     * Represents the mathematical constant known as the Golden Ratio,
     * approximately equal to 1.618. It is defined as the positive solution
     * to the equation φ = (1 + √5) / 2 and is widely used in mathematics,
     * art, and design. The value is stored here as a hexadecimal representation.
     * @type {number}
     */
    static #GOLDEN_RATIO = 0x9e3779b9;

    constructor() {
        // Internal state
        this.internalMemory = new Uint32Array(ISAAC.#BUFFER_LENGTH);
        this.accumulator = 0;
        this.lastResult = 0;
        this.counter = 0;

        // Support vector used during manipulations
        this.v = new Uint32Array(8).fill(ISAAC.#GOLDEN_RATIO);

        // External results
        this.resultArray = new Uint32Array(ISAAC.#BUFFER_LENGTH);
        this.generationCounter = 0;

        // Initial seed with 8 random 32-bit numbers (256-bit)
        this.seed(Array.from({ length: 8 }, () => this.#getRandom32BitNumber()));
    }

    /**
     * Generate a cryptographically secure 32-bit random positive integer.
     *
     * @return {number} A random unsigned 32-bit integer.
     */
    #getRandom32BitNumber() {
        return crypto.getRandomValues(new Uint32Array(1))[0];
    }

    /**
     * Reset the internal state by zeroing out variables and clearing arrays.
     */
    reset() {
        this.accumulator = this.lastResult = this.counter = 0;
        for (let i = 0; i < ISAAC.#BUFFER_LENGTH; ++i) {
            this.internalMemory[i] = this.resultArray[i] = 0;
        }
        this.generationCounter = 0;
    }

    /**
     * Mix the support vector by performing arithmetic and bitwise operations.
     */
    #seedMix() {
        this.v[0] = (this.v[0] ^ (this.v[1] << 11)) >>> 0;
        this.v[3] = (this.v[3] + this.v[0]) >>> 0;
        this.v[1] = (this.v[1] + this.v[2]) >>> 0;
        this.v[1] = (this.v[1] ^ (this.v[2] >>> 2)) >>> 0;
        this.v[4] = (this.v[4] + this.v[1]) >>> 0;
        this.v[2] = (this.v[2] + this.v[3]) >>> 0;
        this.v[2] = (this.v[2] ^ (this.v[3] << 8)) >>> 0;
        this.v[5] = (this.v[5] + this.v[2]) >>> 0;
        this.v[3] = (this.v[3] + this.v[4]) >>> 0;
        this.v[3] = (this.v[3] ^ (this.v[4] >>> 16)) >>> 0;
        this.v[6] = (this.v[6] + this.v[3]) >>> 0;
        this.v[4] = (this.v[4] + this.v[5]) >>> 0;
        this.v[4] = (this.v[4] ^ (this.v[5] << 10)) >>> 0;
        this.v[7] = (this.v[7] + this.v[4]) >>> 0;
        this.v[5] = (this.v[5] + this.v[6]) >>> 0;
        this.v[5] = (this.v[5] ^ (this.v[6] >>> 4)) >>> 0;
        this.v[0] = (this.v[0] + this.v[5]) >>> 0;
        this.v[6] = (this.v[6] + this.v[7]) >>> 0;
        this.v[6] = (this.v[6] ^ (this.v[7] << 8)) >>> 0;
        this.v[1] = (this.v[1] + this.v[6]) >>> 0;
        this.v[7] = (this.v[7] + this.v[0]) >>> 0;
        this.v[7] = (this.v[7] ^ (this.v[0] >>> 9)) >>> 0;
        this.v[2] = (this.v[2] + this.v[7]) >>> 0;
        this.v[0] = (this.v[0] + this.v[1]) >>> 0;
    }

    /**
     * Process a value and update the result array based on the provided
     * index using a masking operation.
     *
     * @param {number} value - The numeric value to be processed and added to
     *   the result array.
     * @param {number} index - The index used for bitwise masking to determine
     *   the position in the result array.
     */
    #processSeedValue(value, index) {
        if (typeof value === 'number') {
            this.resultArray[index & ISAAC.#BYTE_MASK] += value >>> 0;
        }
    }

    /**
     * Initialize and seed the pseudo-random number generator with the given input.
     *
     * The function initializes internal state using the provided seed.
     * If no seed is provided, it initializes with a default value.
     *
     * @param {number|[number]} seedInput - The seed for the random number
     *   generator (a number or an array of numbers).
     */
    seed(seedInput) {
        // Initialize the result array with seed
        let isSeedActive = false;
        if (arguments.length) {
            this.reset();
            isSeedActive = true;
            const seedValues = Array.isArray(seedInput) ? seedInput : [seedInput];
            seedValues.forEach((value, index) => this.#processSeedValue(value, index));
        }

        // Scramble internal values
        for (let i = 0; i < this.v.length; i++) {
            this.v[i] = ISAAC.#GOLDEN_RATIO;
        }
        for (let i = 0; i < 4; i++) {
            this.#seedMix();
        }

        // Fill in the memory array with messy stuff
        for (let i = 0; i < ISAAC.#BUFFER_LENGTH; i += 8) {
            // Use all the information in the seed
            if (isSeedActive) {
                for (let j = 0; j < this.v.length; j++) {
                    this.v[j] = (this.v[j] + this.resultArray[i + j]) >>> 0;
                }
            }

            this.#seedMix();

            for (let j = 0; j < this.v.length; j++) {
                this.internalMemory[i + j] = this.v[j];
            }
        }

        if (isSeedActive) {
            // Do a second pass to make all the seed affect all the result array values
            for (let i = 0; i < ISAAC.#BUFFER_LENGTH; i += 8) {
                for (let j = 0; j < this.v.length; j++) {
                    this.internalMemory[i + j] = this.v[j];
                }

                this.#seedMix();

                for (let j = 0; j < this.v.length; j++) {
                    this.internalMemory[i + j] = this.v[j];
                }
            }
        }

        // Fill the first set of results
        this.generate();
    }

    /**
     * Populate internal buffer of pseudo-random values.
     *
     * @param {number} iterations - A positive integer specifying the number of
     *   iterations for the pseudo-random number generation (PRNG) process.
     *   If not provided, defaults to 1.
     */
    generate(iterations = 1) {
        let previousVal, currentVal;

        iterations = (typeof iterations === 'number' && iterations) ? iterations | 0 : 1;
        while (iterations--) {
            // Counter is incremented once per #BUFFER_LENGTH results
            this.counter = (this.counter + 1) >>> 0;
            // Combine counter with last result
            this.lastResult = (this.lastResult + this.counter) >>> 0;

            for (let i = 0; i < ISAAC.#BUFFER_LENGTH; i++) {
                previousVal = this.internalMemory[i];

                switch (i % 4) {
                    case 0:
                        this.accumulator = (this.accumulator ^ (this.accumulator << 13)) >>> 0;
                        break;
                    case 1:
                        this.accumulator = (this.accumulator ^ (this.accumulator >>> 6)) >>> 0;
                        break;
                    case 2:
                        this.accumulator = (this.accumulator ^ (this.accumulator << 2)) >>> 0;
                        break;
                    case 3:
                        this.accumulator = (this.accumulator ^ (this.accumulator >>> 16)) >>> 0;
                }

                this.accumulator = (this.internalMemory[(i + 128) & ISAAC.#BYTE_MASK] + this.accumulator) >>> 0;

                this.internalMemory[i] = currentVal = (this.internalMemory[(previousVal >>> 2) & ISAAC.#BYTE_MASK] + this.accumulator + this.lastResult) >>> 0;
                this.resultArray[i] = this.lastResult = (this.internalMemory[(currentVal >>> 10) & ISAAC.#BYTE_MASK] + previousVal) >>> 0;
            }
        }

        this.generationCounter = ISAAC.#BUFFER_LENGTH;
    }

    /**
     * Return a random 32-bit unsigned integer.
     *
     * @param {number} iterations - A positive integer specifying the number of
     *   iterations for the pseudo-random number generation (PRNG) process.
     *   If not provided, defaults to 1.
     * @return {number} An integer, pseudo-random number between 0 (inclusive)
     *   and 2147483648 (exclusive).
     */
    random(iterations = 1) {
        if (this.generationCounter === 0) {
            this.generate(iterations);
        }

        return this.resultArray[--this.generationCounter];
    }
}

// =============================================================================
// =============================================================================
// =============================================================================
// =============================================================================

module.exports = ISAAC;
