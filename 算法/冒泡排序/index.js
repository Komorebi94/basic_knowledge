function bubbleSort(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        for (let j = 0; j < i; j++) {
            console.log([arr[j] , arr[j + 1]])
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
        console.log(arr);
    }
    return arr;
}

const arr = [66, 32, 44, 9, 28, 55, 74, 12, 3];

console.log(bubbleSort(arr));
