function addBigNum(str1, str2) {
    let len1 = str1.length;
    let len2 = str2.length;
    let len = len1 > len2 ? len1 : len2;
    let arr1 = str1.split('');
    let arr2 = str2.split('');
    let arr3 = [];
    for (let i = len; i--; i >= 0) {
        let item1 = arr1[i] ? Number(arr1[i]) : 0;
        let item2 = arr2[i] ? Number(arr2[i]) : 0;
        arr3[i] = item1 + item2;
    }
    console.log(arr3);
    let a = false;
    for (let i = arr3.length; i--; i >= 0) {
        if (arr3[i] >= 10) {
            arr3[i] = arr3[i] - 10;
            if (i - 1 < 0) {
                a = true;
            } else {
                arr3[i - 1] = arr3[i - 1] + 1;
            }
        }
    }
    return a ? '1' + arr3.join('') : arr3.join('');
}

console.log(addBigNum('123456789987654321', '923456789987654321'));
