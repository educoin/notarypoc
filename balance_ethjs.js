var Eth = require('ethjs')
var eth = new Eth(web3.currentProvider)
eth.accounts()
.then((accounts) => {
  const account = accounts[0]
  console.log('waiting...')
return eth.getBalance(account)
})
.then((balance) => {
  console.log('Your balance is ' + Eth.fromWei(balance, 'ether'))
})