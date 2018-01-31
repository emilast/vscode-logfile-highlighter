import * as highlighter from '../../src/extension';

describe('Array', () => {
    describe('#indexOf()', () => {
        it('should return -1 when the value is not present', () => {
            expect(-1).toBe([1, 2, 3].indexOf(-1));
        });
    });
});
