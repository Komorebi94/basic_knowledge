const regex = /(\d{4})-(\d{2})-(\d{2})/;

const string = "2020-03-31";

const result = string.replace(regex, "$1/$2/$3");
console.log(result);

const res = string.replace(regex, () => {
    return RegExp.$1 + "/" + RegExp.$2 + "/" + RegExp.$3;
})
console.log(res);

const bar = string.replace(regex, (match, year, month, day) => {
    console.log('match', match);
    return year + "/" + month + "/" + day
})
console.log(bar);