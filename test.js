Array.prototype._reduce = function (fn, init) {
    let pre = init;
    let i = 0;
    let arr = this;
    if(pre === undefined) {
        pre = arr[0];
        i = 1;
    }
    for(i; i < arr.length; i++) {
        pre = fn(pre, arr[i], i, arr);
    }
    return pre;
}
