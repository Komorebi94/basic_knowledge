### 原始类型

-   number
-   string
-   boolean
-   undefined
-   null
-   symbol

### 原始类型与引用类型的区别

-   基础数据以栈的形式存储，常用 typeof 来判断类型
-   引用类型以堆的形式存储，常用 instanceof 来判断类型
-   原始类型存储的是值，对象类型存储的是地址(指针)

    ![原始类型存储.png](./img/1.png '原始类型存储')
    ![引用类型存储.png](./img/2.png '引用类型存储')

### 类型转换

-   number ==> boolean 除了 0、-0、NaN 其他都为 true
-   string ==> boolean 除了空字符串都为 true
-   undefined ==> boolean false
-   null ==> boolean false
-   引用类型 ==> boolean true
-   array ==> string [1,2] ==> '1,2'
-   object ==> string '[object Object]'
-   string ==> number '1'==> 1 , 'a'==> NaN
-   array ==> number []==>0,[1]=>>1,[1,3]=>>NaN
-   null ==> number 0
-   除了数组的引用类型 ==> number NaN
-   Symbol ==> number 抛错

### 如何正确判断 this？箭头函数的 this 是什么？

-   对于直接调用 foo 来说，不管 foo 被放在什么地方，this 一定是 window
-   对于 obj.foo()来说，谁调用了函数，谁就是 this,this 就是 obj
-   对于 new 的方式来说，this 永远被绑定了在实例上，this 不会被任何方式改变
-   箭头函数没有 this,箭头函数的 this 只取决包裹箭头函数的第一个普通函数的 this

### 改变 this 的方式有什么?

-   apply: fn.apply(this 指向(默认 window),[])
-   call : fn.apply(this 指向(默认 window),参数 1，参数 2，...)
-   bind : fn.bind(this 指向(默认 window),参数 1，参数 2，...)，返回一个新的函数
-   无论 bind 绑定几次，this 永远由第一次决定

### == 的判断流程

-   判断两者的类型是否相同，相同的话就是比大小了，类型不同的话就进行类型转换
-   判断是否在比较 null 和 undefined，是的话返回 true
-   判断两者类型是否为 string 和 number，是的话转换为 number
-   判断其中一方是否有 boolean, 先将 boolean 转为 number 再判断
-   判断其中一方是否为 object，另一方为 string、number、symbol， 先将 object 转为原始类型

### 闭包问题

-   闭包存在的意义就是让我们可以间接的访问函数内部的变量
-   防抖和节流函数中都使用到了闭包
-   如果接口请求失败，可以通过闭包的形式进行接口重发
-   可以使用闭包来实现单例模式
-   闭包会增大内存的使用，使用不当会造成内存泄漏，应在退出函数之前将局部变量置空

### 深拷贝和浅拷贝

-   可以使用 lodash 的\_cloneDeep
-   简单方式可以使用 JSON.parse(JSON.stringify(obj))
    -   会忽略 undefined
    -   会忽略 symbol
    -   不能序列化函数
    -   不能解决循环引用的对象
-   Object.assign 可以实现浅拷贝
-   展开运算符【...】也可以实现浅拷贝

### 原型与原型链

-   Object.prototype 是所有对象的爸爸，所有的对象都可以通过 __proto__找到它
-   Function.prototype 是所有函数的爸爸，所有函数都可以通过 __proto__找到它
-   函数的 prototype 是一个对象
-   实例.\__proto__  ===  构造函数.prototype
-   对象的 \__proto__ 属性指向原型 \__proto__将对象和原型连接起来组成了原型链
    ![原型链.png](./img/prototype.png '原型链')

### 作用域和作用域链

-   作用域就是变量与函数的可访问范围，它控制着变量和函数的可见性和生命周期。在 ES6 之前，作用域只有两种：全局作用域和函数作用域。全局作用域中的对象在代码中的任何地方都能访问，其生命周期伴随着页面的生命周期。函数作用域就是在函数内部定义的变量或者函数，并且定义的变量或者函数只能在函数内部被访问。函数执行结束之后，函数内部定义的变量会被销毁。

### var(variable)、let、const(constant)的区别

-   var 会有提升概念(hoisting)
-   函数提升优先于变量提升，函数的提升会把整个函数拿到作用域顶部，变量提升只会把声明挪到作用域顶部
-   var 在全局作用域下声明的变量会挂载在 window 上，let、const 不会
-   let、const 存在暂时性死区，不能在声明前使用
-   const 用来声明常量

### 原型继承和class继承

-   原型链继承
    -   多个实例对引用类型的属性操作会被篡改
    -   创建子类型实例时无法向父类型的构造函数传参
    -   子类型的原型上的 constructor 属性被重写了
    -   给子类型原型添加属性和方法必须在替换原型之后
-   构造函数继承
    -   只能继承父类的实例属性和方法，不能继承原型上面的属性/方法
-   组合继承
    -   创建的实例和原型上存在两份相同的属性
-   寄生组合继承
    -  ```js
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
        ```
-   class 继承
    -   static声明的属性方法无法被子类继承，只能是声明者自己调用

### Commonjs与EsModule

-   CommonJs 是动态语法可以写在判断里，ES6 Module 静态语法只能写在顶层
-   CommonJs 导出时是值得拷贝，import导出的是同一个地址指针
-   CommonJs 是单个值导出，ES6 Module可以导出多个
-   EsModule会编译成require/exports来执行

### Proxy实现监听值得改变读取

```js
let onWatch = (obj, setBind, getLogger) => {
  let handler = {
    get(target, property, receiver) {
      getLogger(target, property)
      return Reflect.get(target, property, receiver)
    },
    set(target, property, value, receiver) {
      setBind(value, property, receiver)
      return Reflect.set(target, property, value)
    }
  }
  return new Proxy(obj, handler)
}
```

### 为什么 0.1 + 0.2 != 0.3 ?

-   因为 JS 采用 IEEE 754(二进制浮点数算术标准) 双精度版本（64位），并且只要采用 IEEE 754 的语言都有该问题。
-   计算机是通过二进制来存储东西的, 0.1 在二进制中是无限循环的一些数字,但是 JS 采用的浮点数标准却会裁剪掉我们的数字, 就会出现精度丢失的问题,也就造成了 0.1 不再是 0.1 了

### async 和 defer

-   有 async，加载和渲染后续文档元素的过程将和 script.js 的加载与执行并行进行（异步）
-   有 defer，加载后续文档元素的过程将和 script.js 的加载并行进行（异步），但是 script.js 的执行要在所有元素解析完成之后，DOMContentLoaded 事件触发之前完成。

### for in 和 for of 的区别

-   for of 循环用来获取一对键值对中的值,而 for in 获取的是 键名
-   一个数据结构只要部署了 Symbol.iterator 属性, 就被视为具有 iterator接口, 就可以使用 for of循环。对象没有 Symbol.iterator这个属性,所以使用 for of会报 obj is not iterable

### 哪些数据结构部署了 Symbol.iteratoer属性了呢?

-   Array、Map、Set、string、NodeList、arguments