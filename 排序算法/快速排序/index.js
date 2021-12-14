function quickSort(arr, begin, end) {
    if(begin >= end) return;
    let lp = begin;
    let rp = end;
    let temp = arr[lp];
    while(lp < rp) {
        while(lp < rp && arr[rp] >= temp) rp--;
        while(lp < rp && arr[lp] <= temp) lp++;
        [arr[lp], arr[rp]] = [arr[rp], arr[lp]]
    }

    [arr[begin], arr[lp]] = [arr[lp], arr[begin]];
    quickSort(arr, begin, lp - 1);
    quickSort(arr, lp + 1, end);
}

const arr = [66, 32, 44, 9, 28, 55, 74, 12, 3];
quickSort(arr, 0, arr.length - 1);
console.log(arr);