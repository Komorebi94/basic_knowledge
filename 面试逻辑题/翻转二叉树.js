function invertTree(root) {
    if(root == null) return;
    const temp = root.left;
    root.left = root.right;
    root.right = temp;
    invertTree(root.left);
    invertTree(root.right);
}

function invertTree(root) {
    if(root == null) return;
    const temp = root.left;
    root.left = root.right;
    root.right = temp;
    invertTree(root.left);
    invertTree(root.right);
}