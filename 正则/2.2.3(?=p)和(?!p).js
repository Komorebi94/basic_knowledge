/**
 * (?=p), 其中p是一个子模式，即p前面的位置，或者说该位置后面的字符要匹配p
 * (?!p) 就是 (?=p) 的反面意思
 */

console.log("hello".replace(/(?=l)/g, "#"));

console.log("hello".replace(/(?!l)/g, "#"))