const PENDING = 'pending';
const RESOLVED = 'resolved';
const REJECTED = 'rejected';

function MyPromise(fn) {
    const that = this;
    that.state = PENDING;
    that.value = null;
    that.resolveCallbacks = [];
    that.rejectCallbacks = [];

    function resolve(value) {
        if(that.state === PENDING) {
            that.state = RESOLVED;
            that.value = value;
            that.resolveCallbacks.forEach(callback => callback(value));
        }
    }

    function reject(value) {
        if(that.state === PENDING) {
            that.state = REJECTED;
            that.value = value;
            that.rejectCallbacks.forEach(callback => callback(value));
        }
    }

    try {
        fn(resolve, reject);
    } catch(err) {
        reject(err)
    }
}

MyPromise.prototype.then = function(onFulfilled, onRejected) {
    const that = this;
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
    onRejected = typeof onRejected === 'function' ? onRejected : err => {throw err};

    if(that.state === PENDING) {
        that.resolveCallbacks.push(onFulfilled);
        that.rejectCallbacks.push(onRejected);
    }

    if(that.state === RESOLVED) {
        onFulfilled(that.value)
    }

    if(that.state === REJECTED) {
        onRejected(that.value);
    }
}

new MyPromise((resolve, reject) => {
    setTimeout(() => {
        Math.random() > 0.5 ? resolve(1) : reject('error');
    }, 1000);
}).then((value) => {
    console.log(value);
}, (err) => {
    console.log(err)
});