/**
 * 通过在量词后面加个问号就能实现惰性匹配
 */
const regex1 = /\d{2,5}/g;
const regex2 = /\d{2,5}?/g;

const string = "123 1234 12345 123456";

console.log(string.match(regex1));
console.log(string.match(regex2));