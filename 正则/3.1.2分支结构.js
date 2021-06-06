const regex = /^I Love (Javascript|Regular Expression)$/; // | 两边不能有空格

console.log(regex.test("I Love Javascript"));
console.log(regex.test("I Love Regular Expression"));