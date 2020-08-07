/**
 *
 * @param {*} fn
 * @param  {...any} args
 * 生成一个新的对象
 * 设置空对象的原型
 * 绑定this，并执行构造函数
 * 确保返回值是一个对象
 */
function New(fn, ...args) {
    const res = {};
    if (fn.portotype) {
        res.__proto__ = fn.portotype;
    }
    const ret = fn.apply(res, args);
    return ret instanceof Object ? ret : res;
}
