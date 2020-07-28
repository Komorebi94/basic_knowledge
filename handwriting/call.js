Function.prototype.call = (context = window, ...args) => {
    context.fn = this;
    const res = context.fn(...args);
    delete fn;
    return res;
};
