function unique(arr) {
    return arr.reduce((acc, cur) => {
        if(acc.includes(cur)) {
            return acc
        } else {
            return [...acc, cur]
        }
    }, [])
};

function unique2(arr) {
    const obj = {};
    return arr.reduce((acc, cur) => {
        if(obj[cur]){
            return acc
        }else {
            obj[cur] = true;
            return [...acc, cur]
        }
    }, [])
}

const arrData = [1,4,5,5,3,2,4,3,8]

console.log(unique(arrData));
console.log(unique2(arrData));
console.log(Array.from(new Set(arrData)))