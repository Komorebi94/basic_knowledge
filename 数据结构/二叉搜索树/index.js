class Node {
    constructor(key) {
        this.key = key;
        this.left = null;
        this.right = null;
    }
}
class BinarySearchTree {
    constructor() {
        this.root = null;
    }
    insert(key) {
        const node = new Node(key);
        if (this.root === null) {
            this.root = node;
        } else {
            this._insertNode(this.root, node);
        }
    }
    _insertNode(node, newNode) {
        if (newNode.key < node.key) {
            if (node.left === null) {
                node.left = newNode;
            } else {
                this._insertNode(node.left, newNode);
            }
        } else {
            if (node.right === null) {
                node.right = newNode;
            } else {
                this._insertNode(node.right, newNode);
            }
        }
    }
    preOrderTraversal(handle) {
        this._preOrderTraversal(this.root, handle);
    }
    _preOrderTraversal(node, handle) {
        if (node != null) {
            handle(node.key);
            this._preOrderTraversal(node.left, handle);
            this._preOrderTraversal(node.right, handle);
        }
    }

    midOrderTraversal(handle) {
        this._midOrderTraversal(this.root, handle);
    }
    _midOrderTraversal(node, handle) {
        if (node != null) {
            this._midOrderTraversal(node.left, handle);
            handle(node.key);
            this._midOrderTraversal(node.right, handle);
        }
    }

    postOrderTraversal(handle) {
        this._postOrderTraversal(this.root, handle);
    }
    _postOrderTraversal(node, handle) {
        if (node != null) {
            this._postOrderTraversal(node.left, handle);
            this._postOrderTraversal(node.right, handle);
            handle(node.key);
        }
    }

    max() {
        let node = this.root;
        let key = null;
        while (node != null) {
            key = node.key;
            node = node.right;
        }
        return key;
    }

    min() {
        let node = this.root;
        let key = node.key;
        while (node != null) {
            key = node.key;
            node = node.left;
        }
        return key;
    }

    search(key) {
        let node = this.root;
        while (node != null) {
            if (key < node.key) {
                node = node.left;
            } else if (key > node.key) {
                node = node.right;
            } else {
                return true;
            }
        }
        return false;
    }

    remove(key) {
        let current = this.root;
        let parent = null;
        let isLeftChild = true;

        while (current.key != key) {
            parent = current;
            if (key < current.key) {
                isLeftChild = true;
                current = current.left;
            } else {
                isLeftChild = false;
                current = current.right;
            }
            if (current == null) return false;
        }

        // 删除的节点是叶子节点
        if (current.left === null && current.right === null) {
            if (current == this.root) {
                this.root = null;
            } else {
                if (isLeftChild) {
                    parent.left = null;
                } else {
                    parent.right = null;
                }
            }
        } else if (current.right === null) {
            // 删除的元素有一个子节点
            if (current == this.root) {
                this.root = current.left;
            } else if (isLeftChild) {
                parent.left = current.left;
            } else {
                parent.right = current.left;
            }
        } else if (current.left === null) {
            if (current == this.root) {
                this.root = current.right;
            } else if (isLeftChild) {
                parent.left = current.right;
            } else {
                parent.right = current.right;
            }
        } else {
            // 删除的元素有两个子节点
            let successor = this._getSuccessor(current);
            if (this.root === current) {
                this.root = successor;
            } else if (isLeftChild) {
                parent.left = successor;
            } else {
                parent.right = successor;
            }
            successor.left = current.left;
        }
        return true;
    }

    _getSuccessor(delNode) {
        let successorParent = delNode;
        let successor = delNode;
        let current = delNode.right;
        // 寻找右边最小值节点
        while (current != null) {
            successorParent = successor;
            successor = current;
            current = current.left;
        }

        if (successor != delNode.right) {
            successorParent.left = successor.right;
            successor.right = delNode.right;
        }

        return successor;
    }
}

const bst = new BinarySearchTree();
bst.insert(11);
bst.insert(7);
bst.insert(15);
bst.insert(5);
bst.insert(3);
bst.insert(9);
bst.insert(8);
bst.insert(10);
bst.insert(13);
bst.insert(12);
bst.insert(14);
bst.insert(20);
bst.insert(18);
bst.insert(25);

const pre = [];
const mid = [];
const post = [];

bst.preOrderTraversal((key) => pre.push(key));
bst.postOrderTraversal((key) => post.push(key));

console.log(pre);
console.log(post);

console.log(bst.remove(24));
bst.midOrderTraversal((key) => mid.push(key));
console.log(mid);
