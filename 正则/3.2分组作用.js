const regex = /(\d{4})-(\d{2})-(\d{2})/;

const string = "2021-06-01";


console.log(regex.test(string));
console.log(RegExp.$1);
console.log(RegExp.$2);
console.log(RegExp.$3);