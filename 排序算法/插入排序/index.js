const arrData = [7,4,8,3,1,5,9];

let count = 0;

function insertSort(arr) {
    let length = arr.length;
    for (let i = 1; i < length; i++) {
        let temp = arr[i];
        let j = i;
        while((arr[j - 1] > temp) && j > 0) {
            count++;
            arr[j] = arr[j-1];
            j--;
        }
        arr[j] = temp;
    }
    console.log(`执行了${count}次`)
    return arr;
}

console.log(insertSort(arrData));