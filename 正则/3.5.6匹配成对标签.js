const regex = /<([^>]+)>[\d\D]*<\/\1>/;

console.log(regex.test("<title>regular expression</title>"))
console.log(regex.test("<p>hahah</p>"))