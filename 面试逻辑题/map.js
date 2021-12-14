const arr = [1,2,'1','1','2',2,'1'];

function bar(arr) {
    const map = new Map();
    arr.forEach(item => {
        let value = map.get(item);
        if(!value) {
            map.set(item, 1)
        } else {
            map.set(item, ++value);
        }
    })

    const max = Math.max(...map.values());
    const res = [];
    map.forEach((value, key) => {
        if(value === max) {
            res.push(key);
        }
    })
    return res;
} 

console.log(bar(arr))