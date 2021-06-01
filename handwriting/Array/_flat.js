const isArray = data => Object.prototype.toString.call(data) === '[object Array]';

Array.prototype._flat = function() {
    const data = this;
    let result = [];
    data.forEach(item => {
        if(isArray(item)) {
            result = result.concat(item._flat());
        } else {
            result.push(item);
        }
    })
    return result;
}

const arr = [1,[3,5,[5,7,4,[0,89]]]];
console.log(arr._flat());