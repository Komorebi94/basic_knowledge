const regex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g;

const string = "#ffbbad #fc01DF #FFF #ffE";

console.log(string.match(regex));