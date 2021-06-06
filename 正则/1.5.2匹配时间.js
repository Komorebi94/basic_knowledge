const regex = /^([01][0-9]|[2][0-3]):[0-5][0-9]$/;

console.log(regex.test("23:59"));
console.log(regex.test("00:00"));


const regex2 = /^(0?[0-9]|1[0-9]|2[0-3]):(0?[0-9]|[1-5][0-9])/;

console.log(regex2.test("3:59"));
console.log(regex2.test("0:0"));