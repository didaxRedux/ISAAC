const assert = require('assert');
const ISAAC = require('../lib/ISAAC');

describe('ISAAC PRNG', function() {
    let isaac;

    beforeEach(function() {
        isaac = new ISAAC();
    });

    it('should generate a 32-bit random integer', function() {
        const randomInt = isaac.random();
        assert.ok(Number.isInteger(randomInt));
    });

    it('should generate a 53-bit random float', function() {
        // Get the two 32-bit numbers
        let random1 = isaac.random();
        let random2 = isaac.random();

        // Combine the numbers to get a 53-bit number
        // The first number occupies the 21 most significant bits, the second the 32 least significant bits
        let combined = (random1 * 2 ** 21) + (random2 >>> 11);

        // Divide by 2^53 to get a number between 0 and 1
        const randomFloat = combined / 2 ** 53;
        assert.ok(randomFloat >= 0 && randomFloat < 1);
    });

    it('should generate 512 random integer', function() {
        let checkResult = true;
        for (let i = 0; i < 512; i++) {
            const randomInt = isaac.random();
            checkResult = Number.isInteger(randomInt);
            if (!checkResult) {
                break;
            }
        }
        assert.ok(checkResult);
    });
});
