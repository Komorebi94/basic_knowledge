class Singleton {
    constructor() { }
}

Singleton.getInstance = (function () {
    let instance
    return () => {
        if (!instance) {
            instance = new Singleton()
        }
        return instance
    }
})()

const a = Singleton.getInstance();
const b = Singleton.getInstance();

console.log(a === b);