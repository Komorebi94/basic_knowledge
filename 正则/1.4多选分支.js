/**
 * 分支结构也是惰性的，即当前面的匹配上了，后面的就不再尝试了
 */

const regex1 = /good|nice/g;

const string = "good idea, nice try.";

console.log(string.match(regex1));

const regex2 = /good|goodBye/g;
const regex3 = /goodBye|good/g;

const string2 = "goodBye";

console.log(string2.match(regex2));
console.log(string2.match(regex3));