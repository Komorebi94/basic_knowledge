let str = "abcabcabcbbccccc";

function getMaxChar(str) {
    const arrData = str.split('');
    const obj = arrData.reduce((acc, cur) => {
        return acc[cur] ? {...acc, [cur]: ++acc[cur]} : {...acc, [cur]: 1}
    }, {})

    let max = 0;
    let char = null;
    for(const key in obj) {
        if(Object.hasOwnProperty.call(obj, key)) {
            if(max < obj[key]) {
                max = obj[key];
                char = key;
            }
        }
    }
    return { [char]: max }
}

console.log(getMaxChar(str));
