/**
 * (?:^|\s)  非捕获分组 ？:
 */

function titleize(str) {
    return str.toLowerCase().replace(/(?:^|\s)\w/g, (word)=>{
        return word.toUpperCase();
    })
}

console.log(titleize('my name is lujx'));