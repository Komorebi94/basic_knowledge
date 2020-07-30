class Parent {
    constructor(name) {
        this.name = name;
        this.colors = ['yellow', 'red'];
    }
    static getName() {
        return 'Parent static funciton only used by Parent';
    }
    getColors() {
        return this.colors;
    }
}

class Child extends Parent {
    constructor(name) {
        super(name);
    }
}

const p1 = new Child('xiaoming');
const p2 = new Child('huahua');

console.log(p1.name);
console.log(p2.name);
// console.log(p1.getName()); // 无法使用
console.log(Parent.getName());
p1.colors.push('black');
console.log(p1.getColors());
console.log(p2.getColors());
