function shellSort(arr) {
    const length = arr.length;
    let gap = Math.floor(length / 2);
    while (gap >= 1) {
        for (let i = gap; i < length; i++) {
            let temp = arr[i];
            let j = i;
            while (arr[j - gap] > temp && j > gap - 1) {
                [arr[j - gap], arr[j]] = [arr[j], arr[j - gap]];
                j = j - gap;
                console.log('jj==>>', j, arr);
            }
            console.log('arr=>>', gap, arr);
            arr[j] = temp;
        }
        console.log(arr);
        gap = Math.floor(gap / 2);
    }
    return arr;
}
const arr = [66, 32, 44, 9, 28, 55, 74, 12, 3];
console.log(shellSort(arr));
