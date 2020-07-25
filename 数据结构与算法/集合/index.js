class Set {
    constructor() {
        this.items = {};
    }

    add(val) {
        if (this.has(val)) return false;
        this.items[val] = val;
        return true;
    }

    remove(val) {
        if (!this.has(val)) return false;
        delete this.items[val];
        return true;
    }

    has(val) {
        return this.items.hasOwnProperty(val);
    }

    clear() {
        this.items = {};
    }

    size() {
        return Object.keys(this.items).length;
    }

    values() {
        return Object.keys(this.items);
    }

    // 集合间的操作
    // 并集
    union(otherSet) {
        const unionSet = new Set();
        let values = this.values();
        values.forEach((element) => {
            unionSet.add(element);
        });
        values = otherSet.values();
        values.forEach((element) => {
            unionSet.add(element);
        });
        return unionSet;
    }
    // 交集
    intersection(otherSet) {
        const intersection = new Set();
        let values = this.values();
        values.forEach((element) => {
            if (otherSet.has(element)) {
                intersection.add(element);
            }
        });
        return intersection;
    }
    // 差集
    difference(otherSet) {
        const difference = new Set();
        let values = this.values();
        values.forEach((el) => {
            if (!otherSet.has(el)) {
                difference.add(el);
            }
        });
        return difference;
    }
    // 子集
    subset(otherSet) {
        if (this.size() > otherSet.size()) return false;
        const values = this.values();
        for (let i = 0; i < values.length; i++) {
            if (!otherSet.has(values[i])) return false;
        }
        return true;
    }
}
module.exports = Set;
let set = new Set();

console.log(set.add(0));
console.log(set.add('sfd'));
console.log(set.add('wrd'));

let set2 = new Set();
set2.add('dsfks');
set2.add(0);
set2.add('sdl');

console.log(set.union(set2));
console.log(set.intersection(set2));
console.log(set.difference(set2));
