/**
 *构造函数只能继承父类的属性，不能继承父类原型上的方法
 */

function Parent(name) {
    this.name = name;
    this.colors = ['yellow', 'red'];
}

Parent.prototype.getColors = function () {
    return this.colors;
};
Parent.prototype.age = 29;

function Child(name) {
    Parent.call(this, name);
}

p1 = new Child('xiaoming');
p2 = new Child('huahua');

console.log(p1.name);
console.log(p2.name);
p1.colors.push('black');
console.log(p1.colors);
console.log(p2.colors);

console.log(p2.age); // 没有这个属性

console.log(p1.getColors()); // 无法使用
