const patchBigInt = () => {
    BigInt.prototype.toJSON = function () {
        return this.toString();
    };
};

module.exports = patchBigInt;
