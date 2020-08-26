function toThousands1(num) {
    [str1, str2] = String(num).split('.');
    let result = [];
    let counter = 0;
    let _arr = str1.split('');
    for (let i = _arr.length - 1; i >= 0; i--) {
        counter++;
        result.unshift(_arr[i]);
        if (!(counter % 3) && i != 0) {
            result.unshift(',');
        }
    }
    return str2 ? result.join('') + `.${str2}` : result.join('');
}

function toThousands2(num) {
    [str1, str2] = String(num).split('.');
    str1 = str1.replace(/(?!^)(?=(\d{3})+$)/g, ',');
    return str2 ? `${str1}.${str2}` : `${str1}`;
}

function toThousands3(num) {
    return num.toFixed(2).replace(/\B(?=(\d{3})+\b)/g, ',');
}

console.log(toThousands3(123456789));
