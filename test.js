const input = { 
	a1: '标题1', 
	b2: '标题2', 
	x3: { 
 		d: '段落1', 
   	    m: 12,
    	k: true,
     	c7: { 
      	    s: 'abc',
       	    k: []
        }
     }
 }
// 提取并拼接一个Object下的所有字符串, 且不超过50长度.
function getSummary(object) {
    let str = "";
    const max = 10;
    const _isObject = arg =>  Object.prototype.toString.call(arg) === "[object Object]"
    return str.slice(0, max);
}
console.log(getSummary(input))
// 输出:
// '标题1标题2段落1abc'