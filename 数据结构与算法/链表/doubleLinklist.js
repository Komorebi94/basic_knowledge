class Node {
    constructor(val) {
        this.data = val;
        this.next = null;
        this.prev = null;
    }
}

class DoublyLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }

    append(data) {
        const node = new Node(data);
        if (this.length === 0) {
            this.head = node;
            this.tail = node;
        } else {
            node.prev = this.tail;
            this.tail.next = node;
            this.tail = node;
        }
        this.length++;
    }

    insert(position, data) {
        if (position < 0 || position > this.length) return false;
        const node = new Node(data);
        if (this.length === 0) {
            this.append(data);
        } else {
            if (position === 0) {
                node.next = this.head;
                this.head.prev = node;
                this.head = node;
            } else if (position === this.length) {
                node.prev = this.tail;
                this.tail.next = node;
                this.tail = node;
            } else {
                let current = this.head;
                let index = 0;
                let previous = null;
                while (index < position) {
                    previous = current;
                    current = current.next;
                    index++;
                }
                node.next = current;
                node.prev = previous;
                current.prev = node;
                previous.next = node;
            }
        }
        this.length++;
        return true;
    }

    get(position) {
        if (position < 0 || position >= this.length) return undefined;

        let current = this.head;
        let index = 0;
        while (index < position) {
            index++;
            current = current.next;
        }
        return current.data;
    }

    indexOf(data) {
        let current = this.head;
        let index = 0;
        while (current) {
            if (data == current.data) {
                return index;
            }
            index++;
            current = current.next;
        }
        return -1;
    }

    update(position, data) {
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
    removeAt(position) {
        if (position < 0 || position >= this.length) return undefined;

        let current = this.head;
        if (this.length === 1) {
            this.head = null;
            this.tail = null;
        } else {
            if (position === 0) {
                this.head = this.head.next;
                this.head.prev = null;
            } else if (position === this.length - 1) {
                current = this.tail;
                this.tail = this.tail.prev;
                this.tail.next = null;
            } else {
                let index = 0;
                while (index < position) {
                    index++;
                    current = current.next;
                }
                current.prev.next = current.next;
                current.next.prev = current.prev;
            }
        }
        this.length--;
        return current.data;
    }

    remove(data) {
        return this.removeAt(this.indexOf(data))
    }

    toString() {
        return this.backwardString();
    }

    backwardString() {
        let current = this.head;
        let str = '';
        while (current) {
            str += current.data + ' ';
            current = current.next;
        }
        return str;
    }

    forwardString() {
        let current = this.tail;
        let str = '';
        while (current) {
            str += current.data + ' ';
            current = current.prev;
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

const list = new DoublyLinkedList();

list.append('abc');
list.append('cba');
list.append('nba');
console.log(list.toString());
console.log(list.forwardString());
console.log(list.insert(2, 'lujx'));
console.log(list.toString());
console.log(list.forwardString());
console.log(list.get(2));
console.log(list.update(2, 'aaa'));
console.log(list.get(2));
console.log(list.toString());
console.log(list.indexOf('aaa'));
console.log(list.removeAt(3));
console.log(list.toString());
