function Parent(name) {
    this.name = name;
    this.colors = ['red', 'yellow'];
}

Parent.prototype.getColors = function () {
    return this.colors;
};

function Child(name) {
    Parent.call(this, name);
}

Child.prototype = Object.create(Parent.prototype, {
    constructor: {
        value: Child,
        enumerable: false,
        configurable: true,
        writable: true,
    },
});
