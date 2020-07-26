const { hashFunc, isPrimeHighEfficiency } = require('./util');

class HashTable {
    constructor() {
        this.storage = [];
        this.count = 0;
        this.limit = 7;
    }

    hashFunc(str, size) {
        return hashFunc(str, size);
    }
    // 插入和修改
    put(key, value) {
        let index = this.hashFunc(key, this.limit);
        let bucket = this.storage[index];
        if (bucket == null) {
            bucket = [];
            this.storage[index] = bucket;
        }

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] === key) {
                bucket[i][1] = value;
                return true;
            }
        }

        bucket.push([key, value]);
        this.count++;
        if (this.count > this.limit * 0.75) {
            const newLimit = this.getPrime(this.limit * 2);
            this.resize(newLimit);
        }
        return true;
    }

    get(key) {
        const index = this.hashFunc(key, this.limit);
        const bucket = this.storage[index];
        if (!bucket) return null;
        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] == key) {
                return bucket[i][1];
            }
        }
        return null;
    }

    remove(key) {
        const index = this.hashFunc(key, this.limit);
        const bucket = this.storage[index];
        if (!bucket) return null;
        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] == key) {
                const val = bucket[i][1];
                bucket.splice(i, 1);
                this.count--;
                if (this.limit > 7 && this.count < this.limit * 0.25) {
                    const newSize = Math.floor(this.limit / 2);
                    let newLimit = this.getPrime(newSize);
                    this.resize(newLimit);
                }
                return val;
            }
        }
        return null;
    }

    isPrime(num) {
        return isPrimeHighEfficiency(num);
    }

    getPrime(newSize) {
        while (!this.isPrime(newSize)) {
            newSize++;
        }
    }

    resize(newLimit) {
        const oldStorage = this.storage;
        this.storage = [];
        this.count = 0;
        this.limit = newLimit;

        oldStorage.forEach((bucket) => {
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i++) {
                this.put(bucket[i][0], bucket[i][1]);
            }
        });
    }

    isEmpty() {
        return this.count === 0;
    }

    sieze() {
        return this.count;
    }
}

const hashTable = new HashTable();
hashTable.put('abc', '123');
hashTable.put('bsd', '532');
hashTable.put('ref', '4532');
hashTable.put('asc', '6451');

console.log(hashTable.get('abc'));
console.log(hashTable.put('abc', '321'));
console.log(hashTable.get('abc'));
console.log(hashTable.remove('ref'));
console.log(hashTable.get('ref'));
