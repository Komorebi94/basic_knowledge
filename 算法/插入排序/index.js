function insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        let temp = arr[i];
        let j = i;
        while (arr[j - 1] > temp && j > 0) {
            [arr[j], arr[j - 1]] = [arr[j - 1], arr[j]];
            j--;
        }
        console.log('j=> ' + j);
        arr[j] = temp;
        console.log(arr);
    }
    return arr;
}

const arr = [66, 32, 44, 9, 28, 55, 74, 12, 3];

console.log(insertionSort(arr));
