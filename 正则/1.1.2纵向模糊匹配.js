/**
 * 纵向模糊指的是，一个正则匹配的字符串，具体到某一位字符时，它可以不是某个确定的字符，可以有多种 可能。
 */

const regex1 = /a[123]b/g;
const regex2 = /a[^123]b/g;

const string = "a0b a1b a2b a3b a4b";

console.log(string.match(regex1));
console.log(string.match(regex2));