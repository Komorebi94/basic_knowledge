class Person {
    constructor(name) {
        this.name = name
    }
    alertName() {
        alert(this.name)
    }
}

class Factory {
    static create(name) {
        return new Person(name)
    }
}

Factory.create('yck').alertName()