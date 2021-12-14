/**
 *
 * @param {*} left
 * @param {*} right
 *
 * 首先获取类型的原型
 * 在获得对象的原型
 * 一直循环判断对象的原型是否等于类型的原型，直到对象的原型为null
 */
function _instanceof(left, right) {
    const prototype = right.prototype;
    left = left.__proto__;
    while (1) {
        if (left === prototype) return true;
        if (left === null) return false;
        left = left.__proto__;
    }
}

console.log(_instanceof([], Array));
