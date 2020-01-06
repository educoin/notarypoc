window.addEventListener('load', setup)
let account, interval

function render(text) {
   console.log('rendering ' + text)
   const content = document.querySelector('.content')
   content.innerText = text
}

function setup() {
  if (typeof window.web3 === 'undefined') {
    render('No web3 found, get MetaMask!')
  } else {
    render('Web3 found, getting balance...')
    pollForAccountChange()
  }
}

function pollForAccountChange() {
  console.log('beginning account change polling...')
  if (!interval) {
    interval = setInterval(getBalance, 1000)
  }
}

function getBalance() {
  // console.log('checking balance.')
  const newAccount = web3.eth.accounts[0]
  
  if (!newAccount) {
     return render('No account selected.') 
  }
  
  if (newAccount === account) {
    return console.log('account unchanged, returning.')
  }
  
  account = newAccount
  
  // console.log('getting balance for ' + account)
  web3.eth.getBalance(account, (err, balance) => {
    if (err) return render(err.message)
    const ether = web3.fromWei(balance, 'ether')
    render(`Account balance: ${ether.toString()}`)
  })
}


    
