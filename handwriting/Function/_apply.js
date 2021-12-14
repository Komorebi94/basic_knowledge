Function.prototype._apply = function(context = window, args) {
    context.fn = this;
    const result = args ? context.fn(...args) : context.fn();
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
console.log(person.fullName._apply(person1,["Seattle", "USA"]))