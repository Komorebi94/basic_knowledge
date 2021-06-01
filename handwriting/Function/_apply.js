Function.prototype._apply = function(context, args) {
    !context && (context = window);
    context.fn = this;
    const result = args ? context.fn(...args) : context.fn();
    delete context.fn;
    return result;
}
