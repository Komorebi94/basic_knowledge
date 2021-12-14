class Node {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}


// 前序遍历
function preOrderTraversal(node) {
    if(node) {
        console.log(node.value);
        if(node.left) preOrderTraversal(node.left);
        if(node.right) preOrderTraversal(node.right);
    }
}

// 中序遍历
function inOrderTraversal(node) {
    if(node) {
        if(node.left) inOrderTraversal(node.left);
        console.log(node.value);
        if(node.right) inOrderTraversal(node.right);
    }
}

// 后序遍历
function postOrderTraversal(node) {
    if(node) {
        if(node.left) postOrderTraversal(node.left);
        if(node.right) postOrderTraversal(node.right);
        console.log(node.value);
    }
}

/**
 * 深度优先遍历
 * 深度优先采用的是堆栈的形式, 即先进后出
 */

function DFS(tree) {
    const stack = Array.isArray(tree) ? tree : [tree];
    const res = [];
    while(stack.length) {
        const node = stack.pop();
        res.push({
            id: node.id,
            name: node.name,
            pid: node.pid
        });

        const children = node.children;
        if(children && children.length) {
            for(let i = children.length - 1; i >=0; i--) {
                stack.push(children[i])
            }
        }
    }
    return res;
}

/**
 * 广度优先遍历
 * 广度优先则采用的是队列的形式, 即先进先出
 */
function BFS(tree) {
    const queue = Array.isArray(tree) ? tree : [tree];
    const res = [];
    while(queue.length) {
        const node = queue.shift();
        res.push({
            id: node.id,
            name: node.name,
            pid: node.pid
        });

        const children = node.children;
        if(children && children.length) {
            for(let i = 0; i < children.length; i++) {
                queue.push(children[i])
            }
        }
    }
    return res;
}


// 二叉树的翻转
function invertTree(root) {
    if(root !== null) {
        const temp = root.left;
        root.left = root.right;
        root.right = temp;
        invertTree(root.left);
        invertTree(root.right);
    }
    return root;
}