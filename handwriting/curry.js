function curry(fn, ...args) {
    let length = fn.length;
    args = args || [];
    return (...innerArgs) => {
        let newArgs = args.concat(innerArgs);
        if(newArgs.length < length) {
            return curry.call(this, fn, ...newArgs);
        } else {
            return fn.apply(this, newArgs);
        }
    }
}
function multiFn(a, b, c) {
    return a * b * c;
}

var multi = curry(multiFn);

console.log(multi()(2,3)(4))