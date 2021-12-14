function binarySearch(arr, val) {
    let low = 0;
    let high = arr.length - 1;
    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        if (arr[mid] == val) {
            return mid;
        } else if (arr[mid] > val) {
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return -1;
}

const arr = [1,2,4,7,9,12,24];

console.log(binarySearch(arr, 2));
console.log(binarySearch(arr, 24));
console.log(binarySearch(arr, 13));