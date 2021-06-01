Function.prototype._bind = function(context = window, ...args) {
    const fn = this;
    function inner(...innerArgs) {
        const _ctx = this instanceof fn ? this : context;
        return fn.apply(_ctx, args.concat(innerArgs));
    }
    function Temp() {};
    Temp.prototype = fn.prototype;
    inner.prototype = new Temp();
    return inner;
}
