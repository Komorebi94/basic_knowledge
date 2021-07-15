const tree = [
    {
        "id": 1,
        "name": "根节点01",
        "pid": 0,
        "children": [
            {
                "id": 2,
                "name": "部门2",
                "pid": 1,
                "children": []
            },
            {
                "id": 3,
                "name": "部门3",
                "pid": 1,
                "children": [
                    {
                        "id": 4,
                        "name": "部门4",
                        "pid": 3,
                        "children": [
                            {
                                "id": 5,
                                "name": "部门5",
                                "pid": 4,
                                "children": []
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        "id": 7,
        "name": "根节点02",
        "pid": 0,
        "children": [
            {
                "id": 8,
                "name": "部门5",
                "pid": 7,
                "children": []
            }
        ]
    }
];
/**
 * 深度优先遍历
 */

function transformArrDFS(tree) {
    let stack = Array.isArray(tree) ? [...tree] : [tree];
    let result = [];
    while(stack.length) {
        let node = stack.pop();
        result.push({
            id: node.id,
            pid: node.pid,
            name: node.name
        })
        let children = node.children;
        if(children && children.length) {
            for(let i = children.length - 1; i >= 0; i--) {
                stack.push(children[i]);
            }
        }
    }
    return result;
}


/**
 * 广度优先遍历
 */
function transformArrBFS(tree) {
    let queue = Array.isArray(tree) ? [...tree] : [tree];
    let result = [];
    while(queue.length) {
        let node = queue.shift();
        result.push({
            id: node.id,
            pid: node.pid,
            name: node.name
        });
        let children = node.children;
        if(children && children.length) {
            for(let i = 0; i < children.length; i++) {
                queue.push(children[i]);
            }
        }
    }
    return result;
}

console.log(transformArrDFS(tree));
console.log(transformArrBFS(tree));