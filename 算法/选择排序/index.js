function selectionSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        let minIndex = i;
        for (let j = i; j < arr.length; j++) {
            console.log([arr[minIndex], arr[j]]);
            if (arr[minIndex] > arr[j]) {
                minIndex = j;
            }
        }
        console.log('minIndex=>' + minIndex);
        [arr[minIndex], arr[i]] = [arr[i], arr[minIndex]];
        console.log(arr);
    }
    return arr;
}

const arr = [66, 32, 44, 9, 28, 55, 74, 12, 3];

console.log(selectionSort(arr));
