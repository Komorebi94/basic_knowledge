Array.prototype._filter = function(fn) {
    const data = this;
    const result = [];
    data.forEach(item => {
        if(fn(item)) {
            result.push(item)
        }
    })
    return result;
}

const arr = [3,6,2,7,8];
console.log(arr._filter(item => item > 5));