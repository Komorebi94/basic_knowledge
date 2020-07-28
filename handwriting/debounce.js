function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(null, args);
        }, delay);
    };
}

function debounceImmediate(fn, delay, immediate) {
    let timer = null;
    return (...args) => {
        timer && clearTimeout(timer);
        if (immediate) {
            immediate = false;
            fn.apply(null, args);
        } else {
            timer = setTimeout(() => {
                fn.apply(null, args);
            }, delay);
        }
    };
}

function fn() {
    console.log(111);
}

const handle = debounceImmediate(fn, 1000, true);

let timer = setInterval(() => {
    handle();
}, 500);

setTimeout(() => {
    clearInterval(timer)
}, 5000);
