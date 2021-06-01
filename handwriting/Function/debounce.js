function debounce(fn, delay, immediately) {
    let timer = null;
    return (...innerArgs) => {
        timer && clearTimeout(timer);
        if(immediately) {
            let run = !timer;
            timer = setTimeout(() => {
                timer = null;
            }, delay);
            run && fn.apply(this, innerArgs);
        } else {
            timer = setTimeout(() => {
                timer = null;
                fn.apply(this, innerArgs);
            }, delay);
        }
    }
}

const log = (data) => console.log(data);

const debounceLog = debounce(log, 300, true);

let count = 0;
let timer = setInterval(() => {
    count++;
    if(count > 500) {
        clearInterval(timer);
        console.log('run done');
    }
    debounceLog(count);
}, 10);