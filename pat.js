
const filePath = new Array(40).fill('/').join('') + '\n'
const t = filePath.match(/(\/.+)+$/)
console.log(t)