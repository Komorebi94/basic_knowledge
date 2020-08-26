let data = [
    { element: '图片', id: '1', pid: '0' }, //count=1
    { element: '大图片', id: '2', pid: '1' },
    { element: 'png', id: '3', pid: '2' },
    { element: 'jpeg', id: '4', pid: '2' },
    { element: 'gif', id: '5', pid: '2' },
    { element: 'gif11', id: '6', pid: '5' },
    { element: 'gif111', id: '7', pid: '6' },
    { element: 'gif222', id: '8', pid: '6' },
    { element: '文字', id: '9', pid: '0' },
    { element: '宋体', id: '10', pid: '9' },
    { element: '宋体111', id: '11', pid: '10' },
    { element: '宋体222', id: '12', pid: '10' },
    { element: '黑体', id: '13', pid: '9' },
];
function transDataToTree(arr, rootid) {
    if (arr.length > 0) {
        return (findChild = (arr, curPid) => {
            let _arr = [];
            let length = arr.length;
            for (var i = 0; i < length; i++) {
                if (arr[i].pid == curPid) {
                    let _item = arr[i];
                    _item.children = findChild(arr, _item.id);
                    _arr.push(_item);
                }
            }
            return _arr;
        })(arr, rootid);
    } else {
        return [];
    }
}
console.log(transDataToTree(data, 0));
