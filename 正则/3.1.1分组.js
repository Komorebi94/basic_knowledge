const regex = /(ab)+/g;

const string = "ababa abbbb ababab";

console.log(string.match(regex)); // [ 'abab', 'ab', 'ababab' ]