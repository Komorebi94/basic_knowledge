const isArray = data => Object.prototype.toString.call(data) === '[object Array]';

Array.prototype._flat = function() {
    const arrData = this;
    return arrData.reduce((acc, cur) => {
        const value = Array.isArray(cur) ? cur._flat() : cur;
        return acc.concat(value);
    },[])
}

const arr = [1,[3,5,[5,7,4,[0,89]]]];
console.log(arr._flat());