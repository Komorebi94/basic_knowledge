const result = "hello".replace(/^|$/g,"#");

console.log(result);

const str = `I
LOVE
JAVASCRIPT`;
console.log(str.replace(/^|$/gm,"#"))