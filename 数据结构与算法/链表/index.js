class Node {
    constructor(val) {
        this.data = val;
        this.next = null;
    }
}

class LinkedList {
    constructor() {
        this.head = null;
        this.length = 0;
    }

    append(val) {
        const node = new Node(val);
        if (this.head === null) {
            this.head = node;
        } else {
            let current = this.head;
            while (current.next) {
                current = current.next;
            }
            current.next = node;
        }
        this.length += 1;
    }

    insert(data, position) {
        if (position < 0 || position > this.length) return false;
        const node = new Node(data);
        if (position === 0) {
            node.next = this.head;
            this.head = node;
        } else {
            let index = 0;
            let current = this.head;
            let previous = null;
            while (index < position) {
                index++;
                previous = current;
                current = current.next;
            }
            node.next = current;
            previous.next = node;
        }
        this.length += 1;
        return true;
    }

    get(position) {
        if (position < 0 || position >= this.length) return null;

        let current = this.head;
        let index = 0;
        while (index < position) {
            index++;
            current = current.next;
        }
        return current.data;
    }
    update(data, position) {
        if (position < 0 || position >= this.length) return false;
        let current = this.head;
        let index = 0;
        while (index < position) {
            index++;
            current = current.next;
        }
        current.data = data;
        return true;
    }

    indexOf(data) {
        let current = this.head;
        let index = 0;
        while (current) {
            if (current.data == data) {
                return index;
            }
            index++;
            current = current.next;
        }
        return -1;
    }

    removeAt(position) {
        if (position < 0 || position >= this.length) return null;

        let current = this.head;
        if (position === 0) {
            this.head = this.head.next;
        } else {
            let index = 0;
            let previous = null;
            while (index < position) {
                index++;
                previous = current;
                current = current.next;
            }
            previous.next = current.next;
            this.length--;
        }

        return current.data;
    }

    remove(data) {
        return this.removeAt(this.indexOf(data));
    }

    toString() {
        let current = this.head;
        let str = '';
        while (current) {
            str += current.data + ' ';
            current = current.next;
        }
        return str;
    }

    size() {
        return this.length;
    }

    isEmpty() {
        return this.length === 0; 
    }
}

const list = new LinkedList();

list.append('abc');
list.append('dsf');
list.append('esd');

console.log(list.toString());

list.insert('lujx', 2);
console.log(list.toString());
console.log(list.update('fsd', 2));
console.log(list.toString());
console.log(list.removeAt(2));
console.log(list.toString());
