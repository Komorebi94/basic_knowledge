function promiseAll(promises) {
    return new Promise((resolve, reject) => {
        let len = promises.length;
        let resolvedCount =  0;
        let resolvedArray = new Array(len);
        for(let i = 0; i < len; i++) {
            Promise.resolve(Promise[i])
                .then(value => {
                    resolvedCount++;
                    resolvedArray[i] = value;
                    if(resolvedCount === len) {
                        return resolve(resolvedArray);
                    }
                }, err => reject(err))
                .catch(err => console.log(err));
        }
    })
}

let wake = (time) => {
    return new Promise((resolve, reject) => {
        resolve(`${time / 1000}秒后醒来`)
    })
  }
  
  let p1 = wake(3000)
  let p2 = wake(2000)
  
  promiseAll([p1, p2]).then((result) => {
    console.log(result)       // [ '3秒后醒来', '2秒后醒来' ]
  }).catch((error) => {
    console.log(error)
  })