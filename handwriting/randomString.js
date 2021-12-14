const chars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
function generateRandomString(originData, n) {
     let res = "";
     for(let i = 0; i < n ; i ++) {
         let id = Math.floor(Math.random()* originData.length);
         res += originData[id];
     }
     return res;
}

for(let i = 0; i < 1000; i++) {
    console.log(generateRandomString(chars, 16))
}