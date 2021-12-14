const _toString = arg => Object.prototype.toString.call(arg);
const isArray = data => _toString(data) === '[object Array]';
const isObject = data => _toString(data) === '[object Object]';

function deepClone(data) {
    if (isArray(data)) {
        const res = [];
        data.forEach((el) => {
            res.push(deepClone(el));
        });
        return res;
    } else if (isObject(data)) {
        const res = {};
        for (let key in data) {
            res[key] = deepClone(data[key]);
        }
        return res;
    } else {
        return data;
    }
}

const tree = [
    {
        id: 1,
        name: 'name_1',
        children: [
            {
                id: 11,
                name: 'name_11',
            },
            {
                id: 12,
                name: 'name_12',
                children: [
                    {
                        id: 121,
                        name: 'name_121',
                    },
                ],
            },
        ],
    },
    {
        id: 2,
        name: 'name_2',
        children: [
            {
                id: 21,
                name: 'name_21',
            },
        ],
    },
    {
        id: 3,
        name: 'name_3',
    },
];
const obj = {
    id: {
        1: {
            2: {
                3: 'rest',
            },
            test: [1, 2, 3, 4],
        },
    },
    name: 'name',
    arr: [
        'age',
        'hello',
        {
            name: 'lujx',
            age: '29',
            tree: tree,
        },
    ],
};

console.log(JSON.stringify(deepClone(obj), null, 4));