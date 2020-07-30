/**
 * 引用类型属性，子类实例共享
 */
function Parent(name) {
    this.name = name;
    this.colors = ['red', 'yellow'];
}

Parent.prototype.getColors = function () {
    return this.colors;
};

function Child() {}
Child.prototype = new Parent();

p1 = new Child('xiaoming');
p2 = new Child('huahua');

console.log(p1.name);
p1.colors.push('black');
console.log(p1.getColors());
console.log(p2.getColors());
