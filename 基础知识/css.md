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

### BFC(块级格式化上下文:Block formatting context)的创建

-   float的值不是none
-   position的值不是static或者relative
-   display的值是inline-block、table-cell、flex、table-caption或者inline-flex
-   overflow的值不是visible
-   属于同一个BFC的两个相邻Box的上下margin会发生重叠

### link和import的区别

-   link属于html标签，import是css提供的
-   link引用的css会同步加载，import引用的CSS会等到页面全部被下载完再被加载
-   link是没有兼容性问题的，import在ie5以上才支持

###  display:none与visibility：hidden的区别？

-   display：none 不显示对应的元素，在文档布局中不再分配空间（回流+重绘）
-   visibility：hidden 隐藏对应元素，在文档布局中仍保留原来的空间（重绘）

### 清除浮动的方式

-   父元素设定height
-   最后一个浮动元素后面加一个div,设置clear：both样式
-   父元素设置样式overflow：hidden | auto;

### css实现三角形

-   宽度width为0；height为0
-   有一条横竖边（上下左右）的设置为border-方向：长度 solid red，这个画的就是底部的直线。其他边使用border-方向：长度 solid transparent。
-   有两个横竖边（上下左右）的设置，若斜边是在三角形的右边，这时候设置top或bottom的直线，和右边的斜线。若斜边是在三角形的左边，这时候设置top或bottom的直线，和左边的斜线。

```css
    #triangle-up {
        width: 0;
        height: 0;
        border-left: 50px solid transparent;
        border-right: 50px solid transparent;
        border-bottom: 100px solid red;
    }
```

### 一边固定，一边自适应

-   浮动
```css
    .left{
      width: 100px;
      background-color: red;
      float: left;
    }
    .right{
      background-color: green;
      margin-left: 100px;
    }
    .container:after {
      clear: both;/*清除浮动*/
    }
```

-   定位
```css
    .left {
      width: 100px;
      background-color: red;
      position: absolute;
    }
    .right {
      background-color: green;
      margin-left: 100px;
    }
```

-   flex
```css
    .container {
      display: flex;
    }
    .left {
      width: 100px;
      background-color: red;
    }
    .right {
      background-color: green;
      flex: 1;
    }
```
### 元素垂直水平居中

-   定宽方案一
    ```css
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
    ```css
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
    ```css
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
    ```css
    .outer {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    ```

