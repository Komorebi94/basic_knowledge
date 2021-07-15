function shellSort(arr) {
    let count = 0;
    let length = arr.length;
    let gap = Math.floor(length / 2);
    while(gap >= 1) {
        for (let i = gap; i < length; i++) {
            let temp = arr[i];   
            let j = i;
            while(arr[j - gap] > temp && j > gap - 1) {
                count++;
                arr[j] = arr[j - gap];
                j -= gap;
            }
            arr[j] = temp;
        }
        gap = Math.floor(gap / 2);
    }
    console.log(`执行了${count}次`);
    return arr;
}

const arrData = [7,4,8,3,1,5,9];

console.log(shellSort(arrData));