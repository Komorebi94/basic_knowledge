Array.prototype._map = function(fn) {
    const data = this;
    let result = [];
    data.forEach(item => {
        result.push(fn(item));
    })
    return result;
}

const arr = [1,7,3,7,8];

console.log(arr._map(item => item + 4));