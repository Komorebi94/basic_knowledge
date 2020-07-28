Function.prototype.apply = (context = window, args) => {
    context.fn = this;
    const res = args ? context.fn(...args) : context.fn();
    delete context.fn;
    return res;
};
