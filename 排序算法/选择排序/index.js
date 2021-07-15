const arrData = [7,4,8,3,1,5,9];

function selectionSort(arr) {
    let count = 0;
    let length = arr.length;
    for (let i = 0; i < length - 1; i++) {
        let minIndex = i;
        for(let j = i + 1; j < length - 1; j++) {
            count++;
            if(arr[minIndex] > arr[j]) {
                minIndex = j; 
            }
        }
        [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
    }
    console.log(`执行了${count}次`)
    return arr;
}

console.log(selectionSort(arrData));