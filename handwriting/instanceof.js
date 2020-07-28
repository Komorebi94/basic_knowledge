function _instanceof(left, right) {
    const prototype = right.prototype;
    left = left.__proto__;
    while (1) {
        if (left === prototype) return true;
        if (left === null) return false;
        left = left.__proto__;
    }
}
