function delRepetaBykey(arr, key) {
    const map = {};
    return arr.reduce((acc, cur) => {
        if(map[cur[key]]) {
            return acc;
        } else {
            map[cur[key]] = true;
            return [...acc, cur]
        }
    },[]);
}
const arr = [
    { name: 'lujx', age: 27, id: 1 },
    { name: 'lujx', age: 27, id: 3 },
    { name: 'addf', age: 25, id: 1 },
    { name: 'sfsf', age: 27, id: 2 },
];

console.log(delRepetaBykey(arr, 'id'))
console.log('~~~~~~~~~~~~~~~~~~~~~~~~~')
console.log(delRepetaBykey(arr, 'name'))
console.log('~~~~~~~~~~~~~~~~~~~~~~~~~')
console.log(delRepetaBykey(arr, 'age'))
