const arr = [1,2,4,2,2,6,3,6,7,4];

const res = arr.sort().filter((el,index)=>{
    return el != arr[index +1]
})

console.log(res)