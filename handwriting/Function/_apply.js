Function.prototype._apply = function(context = window, args) {
    context.fn = this;
    const result = args ? context.fn(...args) : context.fn();
    delete context.fn;
    return result;
}
