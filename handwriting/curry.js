
function curry(fn, args) {
    let length = fn.length;
    console.log("length=>>" + length)
    args = args || [];
    return function () {
        console.log("arguments==>>" + arguments.length)
        // Array.prototype.slice.call(arguments)能够将具有length属性的arguments转换为数组
        let newArgs = args.concat(Array.prototype.slice.call(arguments));
        if (newArgs.length < length) {
            return curry.call(this, fn, newArgs)
        } else {
            return fn.apply(this, newArgs)
        }
    }
}
function multiFn(a, b, c) {
    return a * b * c;
}

var multi = curry(multiFn);

multi(2)(3, 4);