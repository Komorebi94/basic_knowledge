// 哈希函数
function hashFunc(str, size) {
    let hashCode = 0;
    for (let i = 0; i < str.length; i++) {
        hashCode = 37 * hashCode + str.charCodeAt(i);
    }
    return hashCode % size;
}

// 判断一个数字是否是一个质数（低效率）
function isPrimeLowEfficiency(num) {
    for (let i = 2; i < num; i++) {
        if (num % i == 0) {
            return false;
        }
    }
    return true;
}

// 判断一个数字是否是一个质数（高效率）
function isPrimeHighEfficiency(num) {
    const temp = parseInt(Math.sqrt(num));
    for (let i = 2; i <= temp; i++) {
        if (num % i == 0) {
            return false;
        }
    }
    return true;
}

module.exports = { hashFunc, isPrimeLowEfficiency, isPrimeHighEfficiency };
