function addBigNum(str1, str2) {
    const len = str1.length > str2.length ? str1.length : str2.length;
    const arr1 = str1.split().reverse();
    const arr2 = str2.split().reverse();
    const arr3 = [];
    let carry = 0;

    for(let i = 0; i < len; i++) {
        let val1 = arr1[i] ? Number(arr1[i]) : 0;
        let val2 = arr2[i] ? Number(arr2[i]) : 0;
        const value = val1 + val2 + carry;
        arr3[i] = value % 10;
        carry = Math.floor(value / 10);
    }
    const str =  arr3.reverse().join('');
    return carry ? '1' + str : str;
}

console.log(addBigNum('123456789987654321', '923456789987654321'));
