const Queue = require('./index');
class QueueItem {
    constructor(item, priority) {
        this.item = item;
        this.priority = priority;
    }
}
class PriorityQueue extends Queue {
    constructor() {
        super();
    }
    enqueue(item, priority) {
        const queueItem = new QueueItem(item, priority);
        if (this.isEmpty()) {
            this.items.push(queueItem);
        } else {
            let added = false;
            for (let i = 0; i < this.items.length; i++) {
                if (queueItem.priority < this.items[i].priority) {
                    this.items.splice(i, 0, queueItem);
                    added = true;
                    break;
                }
            }
            if (!added) {
                this.items.push(queueItem);
            }
        }
    }

    toString() {
        let str = '';
        this.items.forEach((el) => {
            str += el.item + ' ';
        });
        return str;
    }
}

const pq = new PriorityQueue();

pq.enqueue('abc', 111);
pq.enqueue('dfs', 200);
pq.enqueue('cxs', 50);
pq.enqueue('swe', 66);

console.log(pq.items);
console.log(pq.toString());
