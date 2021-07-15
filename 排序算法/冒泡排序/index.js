const arrData = [7,4,8,3,1,5,9];
let count = 0;
function bubbleSort(arr) {
    let length = arr.length;
    for(let i = length - 1; i >= 0; i--) {
        for (let j = 0; j < i; j++) {
            count++;
            if(arr[j] > arr[j+1]) {
                [arr[j], arr[j+1]] = [arr[j+1], arr[j]]
            }
        }
    }
    console.log(`执行了${count}次`);
    return arr;
}

console.log(bubbleSort(arrData));