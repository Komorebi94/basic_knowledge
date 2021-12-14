
const str = "{[()][]}";

// const str = "{([)][]}";

const map = {
    "{": -1,
    "[": -2,
    "(": -3,
    "}": 1,
    "]": 2,
    ")": 3
}

function bar() {
    const arr = str.split('');
    const stack = [];
    arr.forEach(item => {
        const value = map[item];
        if(stack.length == 0 || value < 0) {
            stack.push(value);
        } else {
            const lastItem = stack.pop();
            if(!((lastItem + value) === 0)){
                stack.push(lastItem);
                stack.push(value);
            }
        }
    })
    return !stack.length;
    
}

console.log(bar(str));

