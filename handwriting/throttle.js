function throttle(fn, delay) {
    let flag = true;
    return (...args) => {
        if (!flag) return;
        flag = false;
        setTimeout(() => {
            fn.apply(null, args);
            flag = true;
        }, delay);
    };
}

/**
 * 立即执行的节流函数
 */

function throttle(fn, delay) {
    let flag = true;
    return (...args) => {
        if (!flag) return;
        fn.apply(null, args);
        flag = false;
        setTimeout(() => {
            flag = true;
        }, delay);
    };
}
