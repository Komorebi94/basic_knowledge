class Node {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}


function preOrderTraversal(node) {
    if(node) {
        console.log(node.value);
        if(node.left) preOrderTraversal(node.left);
        if(node.right) preOrderTraversal(node.right);
    }
}

function DFS(tree) {
    const stack = Array.isArray(tree) ? tree : [tree];
    const result = [];
    while(stack.length) {
        const node = stack.pop();
        result.push({
            id: node.id,
            name: node.name,
            pid: node.pid
        });
        const children = node.children;
        if(children && children.length) {
            for(let i = children.length - 1; i >= 0; i--) {
                stack.push(children[i])
            }
        }
    }
    return result;
}

function BFS(tree) {
    const queue = Array.isArray(tree) ? tree : [tree];
    const result = [];
    while(queue.length) {
        const node = queue.shift();
        result.push({
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
    return result;
}