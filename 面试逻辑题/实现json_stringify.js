// 写一个函数format，传入一个参数，输出格化后的string，为了简化，我们规定参数、object的value和数组的元素只有number、string、array、object四种类型。


```js
const data = [1,2,[3,4]];
```
打印出
```js
[
  1,
  2,
  [
    3,
    4
  ]
]
```
// ### 例子2

传入
```js
const data = {
  a: 1,
  b: [
    2,
    3,
    {
      c: 4
    }
  ],
  d: {
    e: 5,
    f: {
      g: '6'
    },
  }
};
```

打印出
```js
{
  "a": 1,
  "b": [
    2,
    3,
    {
      "c": 4
    }
  ],
  "d": {
    "e": 5,
    "f": {
      "g": "6"
    },
  }
}
```

//**注意事项:**
//1. 本题需用原生方法实现，不能用JSON.stringify方法

/**
 * @param {object|array|number|string} val - 待format的数据
 * @return nothing
 */
function format(val) {
    const _toString = arg => Object.prototype.toString.call(arg);
    const _isArray = data => _toString(data) === '[object Array]';
    const _isObject = data => _toString(data) === '[object Object]';
    // {a:1,b:[1,'2']} => {"a":1,"b":[1,"2"]}
    if(_isArray(val)) {
        let res = ""
        for(let i = 0; i < val.length; i++) {
            const item = val[i];
            if(i != val.length - 1) {
                res += `${format(item)},`;
            } else {
                res += format(item);
            }
        }
        return `[${res}]`;
    } else if(_isObject(val)) { 
        const res = [];
        for(const key in val) {
            const str = `"${key}": ${format(val[key])}`;
            res.push(str);
        }
        return `{${res.join(',')}}`
    } else {
        return data
    }
}



const data = {
  a: 1,
  b: [
    2,
    3,
    {
      c: 4
    }
  ],
  d: {
    e: 5,
    f: {
      g: '6'
    },
  }
};

function format2(data) {
    const _toString = arg => Object.prototype.toString.call(arg);
    const _isArray = arg => _toString(arg) === '[object Array]';
    const _isObject = arg => _toString(arg) === '[object Object]';

    if(_isArray(data)) {
        const res = [];
        data.forEach(item => {
            res.push(format(item));
        })
        return `[${res.join(',')}]`
    } else if(_isObject(data)) {
        const res = [];
        for(const key in data) {
            res.push(`"${key}":${format(data[key])}`)
        }
        return `{${res.join(',')}}`
    } else {
        if(typeof data === 'number') {
            return data
        } else if(typeof data === 'string') {
            return `"${data}"`
        }
    }
}
console.log(format(data))
console.log(JSON.stringify(data));




