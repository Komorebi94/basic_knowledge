/**
 * \1 引用 (-|\.|\/)
 */

const regex = /\d{4}(-|\.|\/)\d{2}\1\d{2}/;

const string1 = "2021-04-02";
const string2 = "2021/04/02";
const string3 = "2021-04/02";
const string4 = "2021/04.02";

console.log(regex.test(string1));
console.log(regex.test(string2));
console.log(regex.test(string3));
console.log(regex.test(string4));