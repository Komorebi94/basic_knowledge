### hooks使用需要注意的事项

-   不要在循环、条件或嵌套函数中调用Hook
-   只能在React函数式组件或自定义Hook中使用Hook

### React 中的 setState 是同步还是异步

-   在合成事件和钩子函数中是异步的，在原生事件和setTimeout中是同步的
-   setTimeout里面拿到的是最新的值

### ComponentWillMount不进行ajax请求原因？

-   react16之后采用了Fiber架构，只有componentDidMount周期函数确定被执行一次，componentWillMount、componentWillReceiveProps、shouldComponentUpdate、componentWillUpdata都有可能执行多次

### 合成事件

-   当用户在为onClick添加函数时，React并没有将Click事件绑定在DOM上面。而是在document处监听所有支持的事件，当事件发生并冒泡至document处时，React将事件内容封装交给中间层SyntheticEvent（负责所有事件合成）所以当事件触发的时候，对使用统一的分发函数dispatchEvent将指定函数执行。

### 调用setState发生了什么

-   在代码中调用setState函数之后，React 会将传入的参数对象与组件当前的状态合并，然后触发所谓的调和过程（Reconciliation）。经过调和过程，React 会以相对高效的方式根据新的状态构建 React 元素树并且着手重新渲染整个UI界面。在 React 得到元素树之后，React 会自动计算出新的树与老树的节点差异，然后根据差异对界面进行最小化重渲染。

### React 的 diff 算法工作过程

-   tree: 对树进行分层比较，两棵树只会对同一层次的节点进行比较。
-   component: 
    -   如果是同一类型的组件，按照原策略继续比较 virtual DOM tree
    -   如果不是，则将该组件判断为 dirty component，从而替换整个组件下的所有子节点
    -   React 允许用户通过 shouldComponentUpdate() 来判断该组件是否需要进行 diff
-   element： 通过设置唯一key的策略


### React 中各种组件复用的优劣势（hoc、renderProps、hooks）

-   高阶组件：把一个不包含state和逻辑的无状态组件作为高阶组件的参数传递进去，在高阶组件内部实现了state和逻辑，然后把state和函数作为props传进去，在render里面返回处理过的组件。
-   renderProps： 通过官方提供的this.props.children这个api，把实现的业务逻辑函数传递进去。

### React 的 Fiber 架构

-   在react16之前，它的更新是同步的，也就是说调用各个组件的生命周期函数，计算和比对Virtual DOM，最后更新DOM树，这整个过程是同步进行的，如果这个过程是比较耗时的，那么react就会一直占用浏览器的主线程，用户的点击输入操作不会获得响应，造成不好的用户体验。
-   React Fiber 把一个耗时长的任务分成很多小片，每一个小片的运行时间很短，虽然总时间依然很长，但是在每个小片执行完之后，都给其他任务一个执行的机会，这样唯一的线程就不会被独占，其他高优先级的任务就有了运行的机会。

### React 性能优化

-   复杂的页面进行组件拆分
-   列表渲染设置唯一key
-   shouldComponentUpdate
-   props和state的数据尽可能简单明了，扁平化

### react hooks实现原理

-   每个组件都会对应一个fiber节点，fiber节点上有一个stateNode属性代表这个组件，还有memoizedState保存的是我们通过useState定义 的变量，它存储的是一个hooks的单向链表。hook上面还有一个memoizedState,它存储的是state的初始值，还有一个queue的变量，它的作用是来存储我们多次调用dispatchAction时保存的一个环状链表。

### Redux的工作流程

-   用户通过视图view发出动作action，也就是执行dispath
-   store自动调用reducer, 并传入当前的state以及action，执行返回一个新的state
-   state发生变化，store就会调用监听函数，更新view

### 虚拟dom到底快在哪里？

-   虚拟DOM提高性能，不是说不操作DOM，而是减少操作DOM的次数，减少回流和重绘
-   虚拟 dom 相当于在 js 和真实 dom 中间加了一个缓存，利用 dom diff 算法避免了没有必要的 dom 操作，从而提高性能

### jsx是如何转换为真是dom的？

-   编写jsx语法，通过babel来进行转换
-   babel将jsx代码转换为react.createElement形式来进行调用,接受三个参数（type，props，children）
-   react.createElemen通过调用createElement方法来进行渲染虚拟DOM
-   虚拟DOM通过reactDOM.render（）方法来进行转换为真实DOM