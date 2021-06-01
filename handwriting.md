### reduce

```javascript
Array.prototype._reduce = function (fn, init) {
    let pre = init;
    let i = 0;
    let arrData = this;
    if(pre === undefined) {
        pre = arrData[0];
        i = 1;
    }
    for(i; i < arrData.length; i++) {
        pre = fn(pre, arrData[i], i, arrData)
    }
    return pre;
}
```



```javascript
const arr = [1,3,6,7];

let result = arr._reduce((acc, cur) => {
    return [...acc, cur * 2];
}, []);
console.log(result);
```



### flat

```javascript
const isArray = data => Object.prototype.toString.call(data) === '[object Array]';

Array.prototype._flat = function () {
    const arrData = this;
    let result = [];
    arrData.forEach(item => {
        if(isArray(item)) {
            result = result.concat(item._flat())
        } else {
            result.push(item)
        }
    })
    return result;
}
```



```javascript
const arr = [1,[3,5,[5,7,4,[0,89]]]];
console.log(arr._flat());
```



### filter

```javascript
Array.prototype._filter = function (fn) {
    const arrData = this;
    const result = [];
    arrData.forEach(item => {
        if(fn(item)) {
            result.push(item);
        }
    })
    return result;
}
```



```javascript
const arr = [3,6,2,7,8];
console.log(arr._filter(item => item > 5));
```



### map

```javascript
Array.prototype._map = function (fn) {
    const arrData = this;
    const result = [];
    arrData.forEach(item => {
        result.push(fn(item));
    })
    return result;
}
```



```javascript
const arr = [1,7,3,7,8];
console.log(arr._map(item => item + 4));
```



### call

```javascript
Function.prototype._call = function (context = window, ...args) {
    context.fn = this;
    const result = context.fn(...args);
    delete context.fn;
    return result;
}
```



```javascript
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
```



### apply

```javascript
Function.prototype._apply = function (context = window, args) {
    context.fn = this;
    const result = args ? context.fn(...args) : context.fn();
    delete context.fn;
    return result;
}
```



```javascript
let person = {
  fullName: function(city, country) {
    return this.firstName + " " + this.lastName + "," + city + "," + country;
  }
}
let person1 = {
  firstName:"John",
  lastName: "Doe"
}
console.log(person.fullName.apply(person1, ["Oslo", "Norway"]))
```



### bind	

```javascript
Function.prototype._bind = function (context = window, ...args) {
    const fn = this;
    args = args || [];
    function inner (...innerArgs) {
        const _ctx = this instanceof fn ? this : context;
        return fn.apply(_ctx, args.concat(innerArgs));
    }
    function Temp() {};
    Temp.prototype = fn.prototype;
    inner.prototype = new Temp();
    return inner;
}
```



```javascript
let obj = { name: "Smiley" };
let greeting = function (str, lang) {
    this.value = 'greetingValue';
    console.log("Welcome " + this.name + " to " + str + " in " + lang);
};
let objGreeting = greeting.myBind(obj, 'the world');
let newObj = new objGreeting('JS');
console.log(newObj.value);
```



### debounce

```javascript
function debounce(fn, delay, immediately) {
    let timer = null;
    return (...innerArgs) => {
        timer && clearTimeout(timer);
        if(immediately) {
            let run = !timer;
            timer = setTimeout(() => {
                timer = null;
            }, delay);
            run && fn.apply(this, innerArgs);
        } else {
            timer = setTimeout(() => {
                fn.apply(this, innerArgs);
                timer = null;
            }, delay);
        }
    }
}
```



```javascript
const log = (data) => console.log(data);
const debounceLog = debounce(log, 300, true);

let count = 0;
let timer = setInterval(() => {
    count++;
    if(count > 500) {
        clearInterval(timer);
        console.log('run done');
    }
    debounceLog(count);
}, 10);
```



### throttle

```javascript
function throttle(fn, delay) {
    let flag = true;
    return (...innerArgs) => {
        if(!flag) return;
        flag = false;
        setTimeout(() => {
            fn.apply(this, innerArgs);
            flag = true;
        }, delay);
    }
}
```



```javascript
const log = (data) => console.log(data);
const throttleLog = throttle(log, 1000, true);

let count = 0;
let timer = setInterval(() => {
    count++;
    if(count > 500) {
        clearInterval(timer);
        console.log('run done');
    }
    throttleLog(count);
}, 10);
```



### curry

```javascript
function curry(fn, ...args) {
    let length = fn.length;
    args = args || [];
    return (...innerArgs) => {
        let newArgs = args.concat(innerArgs);
        if(newArgs.length < length) {
            return curry.call(this, fn, ...newArgs);
        } else {
            return fn.apply(this, newArgs);
        }
    }
}
```



```javascript
function multiFn(a, b, c) {
    return a * b * c;
}

let multi = curry(multiFn);

multi(2)(3, 4);
```



### instanceOf

```javascript
function _instanceof(left, right) {
    const right_prototype = right.prototype;
    let left_prototype = left.__proto__;
    while(1) {
        if(left_prototype === right_prototype) return true;
        if(left_prototype === null) return false;
        left_prototype = left_prototype.__proto__;
    }
}
```



### create

```	javascript
function create(obj) {
    function F() {};
    F.prototype = obj;
    return new F();
}
```



### new

```	javascript
/**
 * @param {*} fn
 * @param  {...any} args
 * 生成一个新的对象
 * 设置空对象的原型
 * 绑定this，并执行构造函数
 * 确保返回值是一个对象
 */
function New(fn, ...args) {
    const res = {};
    if (fn.portotype) {
        res.__proto__ = fn.portotype;
    }
    const ret = fn.apply(res, args);
    return ret instanceof Object ? ret : res;
}

```



### deepClone

```javascript
const _toSting = args => Object.prototype.toString.call(args);
const isArray = data => _toSting(data) === '[object Array]';
const isObject = data => _toSting(data) === '[object Object]';
function deepClone(data) {
    if(isArray(data)) {
        const reslut = [];
        data.forEach(item => {
            reslut.push(deepClone(item));
        });
        return reslut;
    } else if(isObject(data)) {
        const reslut = {};
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                reslut[key] = deepClone(data[key]);
            }
        }
        return reslut;
    } else {
        return data;
    }
}
```



```javascript
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

console.log(JSON.stringify(deepClone(obj)));
```



### unique 

```

```



### binarySearch

```javascript
function binarySearch(arr, val) {
    let low = 0;
    let high = arr.length - 1;
    while(low <= high) {
        let mid = Math.floor((low + high) / 2);
        if(arr[mid] === val) {
            return mid;
        } else if(arr[mid] > val) {
            high = mid - 1;
        } else {
            low = mid + 1
        }
    }
    return -1;
}
```



```javascript
const arr = [1,4,7,9,13,18];

console.log(binarySearch(arr, 4));
console.log(binarySearch(arr, 13));
```

