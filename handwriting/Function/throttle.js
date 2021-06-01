function throttle(fn, delay) {
    let flag = true;
    return (...innerArgs) => {
        if(!flag) return;
        flag = false;
        setTimeout(() => {
            flag = true;
            fn.apply(this, innerArgs);
        }, delay);
    }
}


const log = (data) => console.log(data);

const throttleLog = throttle(log, 1000, true);

let count = 0;
let timer = setInterval(() => {
    count++;
    if(count > 500) {
        clearInterval(timer);
        console.log('run done');
    }
    throttleLog(count);
}, 10);