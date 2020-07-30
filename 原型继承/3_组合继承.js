function Parent(name) {
    this.name = name;
    this.colors = ['yellow', 'red'];
}

Parent.prototype.getColors = function () {
    return this.colors;
};

function Child(name) {
    Parent.call(this, name);
}

Child.prototype = new Parent();

const p1 = new Child('xiaoming');
const p2 = new Child('huahua');
p1.colors.push('black');

console.log(p1.name);
console.log(p2.getColors());