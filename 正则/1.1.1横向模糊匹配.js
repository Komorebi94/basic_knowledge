/**
 * 横向模糊指的是:一个正则可匹配的字符串的长度不是固定的，可以是多种情况的。
 */

const regex1 = /ab{2,5}c/g;
const regex2 = /ab{2,5}c/;
const string = "abc abbc abbbc abbbbc abbbbbc abbbbbbc";

console.log(string.match(regex1));
console.log(string.match(regex2));