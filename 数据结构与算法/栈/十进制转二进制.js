function dec2bin(decNumber) {
    const stack = new Array();
    while (decNumber > 0) {
        stack.push(decNumber % 2);
        decNumber = Math.floor(decNumber / 2);
    }
    return stack.reverse().join("");
}

console.log(dec2bin(10))