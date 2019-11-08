const fs = require('fs')

// read data
const string = fs.readFileSync('./db/user.json').toString()
const dataArray = JSON.parse(string)
console.log(dataArray);

// write data
const user3 = {"name": "Bob", "password": "xxx"}
dataArray.push(user3)
const stringify = JSON.stringify(dataArray)
fs.writeFileSync('./db/user.json', stringify)