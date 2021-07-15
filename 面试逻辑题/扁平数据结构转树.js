// 输入
let arr = [
    {id: 1, name: '部门1', pid: 0},
    {id: 2, name: '部门2', pid: 1},
    {id: 3, name: '部门3', pid: 1},
    {id: 4, name: '部门4', pid: 3},
    {id: 5, name: '部门5', pid: 4},
];

// 输出
[
    {
        "id": 1,
        "name": "部门1",
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
                    // 结果 ,,,
                ]
            }
        ]
    }
];

function transformTree (list, options = {}) {
    const {
        keyField = 'id',
        childField = 'haizi',
        parentField = 'pid'
    } = options

    const tree = []
    const record = {}

    for (let i = 0, len = list.length; i < len; i++) {
        const item = list[i]
        const id = item[keyField]
        /**
         * 如果record对象里面不存在此id：item.children = record.id = [];
         * 如果record对象里面存在此id:item.children = record.id;
         */
        if (record[id]) {
            item[childField] = record[id]
        } else {
            item[childField] = record[id] = []
        }
        /**
         * 如果item.pid为真，说明此元素为子部门，否则为根节点
         */
        if (item[parentField]) {
            const parentId = item[parentField]

            /**
             * 如果 record 里面没有 id === pid 的值 
             */
            if (!record[parentId]) {
                record[parentId] = []
            }
            /**
             * record 里面有 id === pid 的值，
             * 则此元素是 id:[] 的children
             */
            record[parentId].push(item)
        } else {
            tree.push(item)
        }
        console.log(record);
    }
    return tree
}

console.log(JSON.stringify(transformTree(arr)));