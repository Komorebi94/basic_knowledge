Array.prototype._reduce = function(fn, init) {
    let pre = init, i = 0;
    let array = this;
    if(pre === undefined) {
        pre = array[0];
        i = 1;
    }
    for(i; i < array.length; i++) {
        pre = fn(pre, array[i], i, array);
    }
    return pre;
}


const arr = [1,3,6,7];

let result = arr._reduce((acc, cur) => {
    return [...acc, cur * 2];
}, []);
console.log(result);