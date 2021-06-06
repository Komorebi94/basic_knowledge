function trim(str) {
    return str.replace(/^\s+|\s+$/g, "");
}

function _trim(str) {
    return str.replace(/^\s*(.*?)\s*$/g, "$1");
}

console.log(trim("  adsf "));
console.log(_trim("  slfj  "));