function New(fn, ...args) {
    const res = {};
    if (fn.portotype) {
        res.__proto__ = fn.portotype;
    }
    const ret = fn.apply(res, args);
    return ret instanceof Object ? ret : res;
}
