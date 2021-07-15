Function.prototype._call = function (context = window, ...args) {
    context.fn = this;
    const result = context.fn(...args);
    delete context.fn;
    return result;
}

let person = {
    fullName: function (city, country) {
        return this.firstName + " " + this.lastName + "," + city + "," + country;
    }
}
let person1 = {
    firstName: "Bill",
    lastName: "Gates"
}
console.log(person.fullName._call(person1, "Seattle", "USA"))