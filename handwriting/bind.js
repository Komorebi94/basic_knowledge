Function.prototype.bind = (context = window, ...args) => {
    const that = this;
    const resultFn = (...innerArgs) => {
        if (this instanceof resultFn) {
            return that.apply(this, args.concat(innerArgs));
        } else {
            return that.apply(context, args.concat(innerArgs));
        }
    };
    return resultFn;
};
