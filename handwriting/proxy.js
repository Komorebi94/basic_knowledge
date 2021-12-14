const onWatch = (obj, setFn, getLogger) => {
    const handler = {
        get(target, property, receiver) {
            getLogger(target, property, receiver)
            return Reflect.get(target, property, receiver);
        },
        set(target, property, value, receiver) {
            setFn(target, property, value, receiver);
            return Reflect.set(target, property, value);
        }
    }
    return new Proxy(obj, handler)
}

const onWatch = (obj, setFn, getFn) => {
    const handler = {
        get(target, property, receiver) {
            getFn(target, property, receiver);
            return Reflect.get(target, property, receiver);
        },
        set(target, property, value, receiver) {
            setFn(target, property, value, receiver);
            return Reflect.set(target, property, value);
        }
    }
    return new Proxy(obj, handler);
}