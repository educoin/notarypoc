const Eth = require('ethjs')
let account, interval, eth, contract, Counter, counter,
    setupLoop, counterUpdateLoop

// Ropsten instance by default:
const contractAddress = '0xC4a1c303451cac7a8bf4f498B8c9BcF1b8fB1ed9'
const contractAbi = [[{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"reset","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"value","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"get_double","outputs":[{"name":"d","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"increment","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}]]

window.addEventListener('load', setup)

function render(text) {
   const content = document.querySelector('.content')
   content.innerText = text
}

function renderStatus(text) {
   const content = document.querySelector('.message')
   content.innerText = text
}

function setup() {
  console.log('attempting setup')
  
  if (typeof window.web3 === 'undefined') {
    renderStatus('No web3 found, get MetaMask!')
  } else {
    account = web3.eth.accounts[0]
    
    renderStatus('Web3 found! Loading counter value!')
    eth = new Eth(web3.currentProvider);
    counter = eth.contract(contractAbi).at(contractAddress)
    loadCounterValue()
    
    const button = document.querySelector('button.increment')
    button.addEventListener('click', increment)
  }
}

function loadCounterValue() {
  let firstUpdate = true
  setInterval(() => {
    counter.get()
    .then(result => {
      if (firstUpdate) {
        renderStatus('loaded.')
        firstUpdate = false
      }
      render(result[0].toString())
    })
    .catch(reason => {
      render(`Error: ${reason.message}`)
    })
  }, 500)
}

function increment () {
  console.log('increment!')
  counter.increment({ from: account })
  .then(txHash => {
     renderStatus('Transaction sent! Waiting for block inclusion.')
     return eth.getTransactionSuccess(txHash)
  }).then((txReceipt) => {
     renderStatus(`Increment complete!`)
  })
}