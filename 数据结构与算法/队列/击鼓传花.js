const Queue = require('./index');

function passGame(nameArr, num) {
    const queue = new Queue();
    nameArr.forEach((name) => {
        queue.enqueue(name);
    });

    while (queue.size() > 1) {
        for (let i = 0; i < num - 1; i++) {
            queue.enqueue(queue.dequeue());
        }
        queue.dequeue();
    }
    const res = queue.front();
    return [res, nameArr.indexOf(res)];
} 

const nameArr = ['aa', 'bb', 'cc', 'dd', 'ee'];
console.log(passGame(nameArr, 3));
