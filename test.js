function quickSort(arr, begin, end) {
    if (begin >= end) return;

    let l = begin;
    let r = end;
    let temp = arr[begin];

    while (l < r) {
        while (l < r && arr[r] >= temp) r--;
        while (l < r && arr[l] <= temp) l++;
        [arr[l], arr[r]] = [arr[r], arr[l]];
    }
    [arr[begin], arr[l]] = [arr[l], arr[begin]];
    quickSort(arr, begin, l - 1);
    quickSort(arr, l + 1, end);
    return arr;
}

const arr = [66, 32, 44, 9, 28, 55, 74, 12, 3];
quickSort(arr, 0, arr.length - 1);
console.log(arr);


Mxcommon.getEncryptString(encryptString => {
    // encryptString 就是拿到的随机字符串
    data.token = encryptString;
});