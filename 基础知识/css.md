### 介绍一下标准的 css 的盒子模型？低版本 IE 的盒子模型有什么不同

-   标准盒模型：box-sizing: content-box;
-   怪异盒模型(IE 盒模型)：box-sizing: border-box;
-   标准盒模型：width = content
-   怪异盒模型：width = content + padding x 2 + border x 2
    ![标准盒模型.jfif](./img/box1.jfif)
    ![怪异盒模型.jfif](./img/box2.jfif)

### 伪类和伪元素的区别

-   伪类是文档树中已存在的元素，伪元素则是创建了一个 DOM 之外的元素
-   伪类用于添加元素的特殊效果，伪元素则是添加元素内容
-   伪类使用一个冒号，伪元素使用两个冒号

### 元素垂直水平居中

-   定宽方案一
    ```
    .outer {
        height: 100%;
        position: relative;
    }
    .inner {
        width: 100px;
        height: 150px;
        position: absolute;
        background-color: pink;
        left: 50%;
        top: 50%;
        margin-left: -50px;
        margin-top: -75px;
    }
    ```
-   定宽方案二
    ```
    .outer {
        height: 100%;
        position: relative;
    }
    .inner {
        width: 100px;
        height: 100px;
        background-color: yellow;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: auto;
    }
    ```
-   不定宽方案一
    ```
    .outer {
        height: 100%;
        position: relative;
    }
    .inner {
        position: absolute;
        top: 50%;
        left: 50%;
        background-color: red;
        transform: translate(-50%, -50%);
    }
    ```
-   不定宽方案二
    ```
    .outer {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    ```
