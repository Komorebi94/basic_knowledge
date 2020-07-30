const _toString = arg => Object.prototype.toString.call(arg);
export const isObject = obj => _toString(obj) === '[object Object]';
export const isArray = arg => _toString(arg) === '[object Array]'
const isNil = arg => arg === undefined || arg === null;
export const queryParse = str => {
    return str.replace(/^\?/, '').split('&').reduce((acc, section) => {
        const [key, value] = section.split('=');
        return isNil(value) ?
            acc :
            Object.assign({}, acc, {
                [key]: value
            })
    }, {})
}

export const queryString = query => {
    if (!isObject(query)) {
        throw new Error('query string . stringify need an object type argument');
    } else {
        return Object.keys(query)
            .filter(key => !isNil(query[key]))
            .map(key => `${key}=${query[key]}`)
            .join('&')
    }
}