import BLKCC_Notary_View from './BLKCC_Notary_View.js';

export default class BLKCC_Notary {

  constructor(argObj = {}) {
    if(!(this instanceof BLKCC_Notary)) {return new BLKCC_Notary(argObj);}
    document.readyState === 'complete'
      ? this.init(argObj)
      : window.addEventListener('load', () => this.init(argObj));
  }
  
  init(argObj = {}) {
    window.addEventListener('error', this.error);
    this.errorLocks = {};
    Object.assign(this, argObj);
    window[this.global] = this;
    this.view = new this.View({notary: this, querySelector: this.querySelector});
    
    const Web3 = require('web3'),
    web3js = this.web3js = new Web3(
      typeof web3 !== 'undefined'
      ? web3.currentProvider
      : new Web3.providers.HttpProvider(this.web3Provider)
    );
    this.contract = web3js.eth.contract(this.contractABI).at(this.contractAddress);
    console.info(
      'Web3 provider:', web3js.currentProvider.host || web3js.currentProvider.constructor.name,
      '\nWeb3 version:', web3js.version.api,
      '\nContract address:', this.contract.address
    );
    this.hashFn = window[this.hashName] || this.web3js.sha3;

    window.setInterval(this.updPoll, this.pollInterval);
    return this.updPoll();
  }
  
  error(err, lock) {
    if(lock) {
      if(lock in notary.errorLocks) {return false;}
      else {notary.errorLocks[lock] = true;}
    }
    console.error(err);
    notary.view.error(err);
    //throw err;
    return err;
  }
  
  regFile(input) {
    let file = input.files[0];
    if(!file) {return this.error(new Error('No file selected'));}
    const reader = new FileReader();
    reader.addEventListener('load', ev => this.regText(input, ev.target.result));
    reader.addEventListener('error', err => this.error(err));
    reader.readAsText(file, "utf-8");
  }
  
  regText(input, text) {this.regHash(input, this.hashFn(text || input.value));}
  
  regHash(input, hash) {
    hash = hash || input.value;
    (input.preview || input).value = hash.substr(0,2) !== '0x' ? `0x${hash}` : hash;
  }
  
  async verHash(hash) {if(!await notary.hashExists(hash)) {notary.view.showResult(`Hash ${hash} is not registered`);}}
  
  async hashExists(hash) {return new Promise((resolve, reject) => {
    this.contract.blockTs(hash, (err, ts) => {
      if(err) {return reject(this.error(err));}
      if(ts == 0) {return resolve(false);}
      this.contract.blockNr(hash, (err, blockNr) => {
        if(err) {return reject(this.error(err));}
        resolve(this.view.showResult(`${hash}\n\nhash already registered\n\non ${(new Date(ts*1000)).toUTCString()}\n\nat block ${blockNr}`));
      });
    });
  });}
  
  async submitHash(hash) {
    if(await this.hashExists(hash)) {return;}
    if(this.errorLocks.login) {return this.view.showResult('Not logged into <a href="https://metamask.io/" target="_blank">Metamask</a>');}
    this.contract.addRecord.sendTransaction(hash, {
      from: this.account,
      gas: this.gas,
      gasPrice: this.gasPrice
    }, (err, res) => {
      if(err) {return this.error(err);}
      this.view.showResult(`${hash}\n\nhash registered as transaction\n\n<a href="https://${this.etherscan}/tx/${res}" target="_blank">${res}</a>`);
      this.updInfo();
    });
  }
  
  updPoll() {
    if(notary.missingMetamask()) {return notary;}
    if(notary.account !== web3.eth.accounts[0]) {notary.updInfo();}
    return notary.updBal();
  }
  
  missingMetamask() {
    if(typeof web3 === 'undefined' || !web3.eth.accounts[0]) {
      this.error('Not logged into <a href="https://metamask.io/" target="_blank">Metamask</a>', 'login');
      return true;
    } else {
      delete this.errorLocks.login;
      return false;
    }
  }
  
  updInfo() {
    this.account = this.web3js.eth.accounts[0];
    this.web3js.version.getNetwork((err, netInt) => {
      if(err) {return this.error(err);}
      this.view.setInfo('network', this.network = (this.networks[netInt] || 'unknown'));
      this.etherscan = (this.network === 'mainnet')
        ? 'etherscan.io'
        : `${this.network}.etherscan.io`;
      this.view.setInfo('account', `<a href="https://${this.etherscan}/address/${this.account}" target="_blank">${this.account}</a>`);
    });
    return this;
  }
  
  updBal() {
    this.web3js.eth.getBalance(this.account, (err, balance) => {
      if(err) {return this.error(err);}
      if(
        this.balance.c[0] === balance.c[0]
        && this.balance.c[1] === balance.c[1]
      ) {return;}
      this.view.setInfo('balance', this.web3js.fromWei(this.balance = balance, 'ether'));
    });
    return this;
  }
  
};
{
  let proto = BLKCC_Notary.prototype;
  proto.global = 'notary';
  proto.querySelector = '.notary';
  proto.pollInterval = 1000;
  proto.hashName = 'keccak_256';
  // proto.web3Provider = 'https://ropsten.infura.io/zdW1wbAwFlUpJ3MXYO8M'; // ROPSTEN
  proto.web3Provider = 'http://127.0.0.1:8545'; // PRIVATE
  proto.gas = 400000;
  proto.gasPrice = 1;  // to be checked for a public mainnet should be much higher 
  
  //------------------------------Please insert here the new address of the smart contract deployed on the newly Ethereum Network-----------------------------------------------
  
  //proto.contractAddress = '0x973e7f7cbcdda053e57896daf9990330e50cbe7c'; //CTIE
  // proto.contractAddress = '0x3e36fc445441cdea7f380aec633e6bb0d35a87ff'; // ROPSTEN
  proto.contractAddress = '0x65f78b9575bef09bbfc429e5977108b7558f4c3f'; // PRIVATE BLKCC NETWORK
  
  
  proto.contractABI = [
    {"name": "addMultipleRecords", "constant": false, "inputs": [{"name": "zz", "type": "uint256[]"}], "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "nonpayable", "type": "function"},
    {"name": "addMultipleRecordsStrict", "constant": false, "inputs": [{"name": "zz", "type": "uint256[]"}], "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"},
    {"name": "addRecord", "constant": false, "inputs": [{"name": "z", "type": "uint256"}], "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"},
    {"name": "addRecordStrict", "constant": false, "inputs": [{"name": "z", "type": "uint256"}], "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function"},
    {"name": "REC", "anonymous": false, "inputs": [{"indexed": false, "name": "h", "type": "uint256"}], "type": "event"},
    {"name": "DUP", "anonymous": false, "inputs": [{"indexed": false, "name": "h", "type": "uint256"}], "type": "event"},
    {"type": "constructor", "inputs": [], "payable": false, "stateMutability": "nonpayable"},
    {"name": "blockNr", "constant": true, "inputs": [{"name": "", "type": "uint256"}], "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"name": "blockTs", "constant": true, "inputs": [{"name": "", "type": "uint256"}], "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"name": "checkRecords", "constant": true, "inputs": [{"name": "zz", "type": "uint256[]"}], "outputs": [{"name": "r", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"name": "totalRecords", "constant": true, "inputs": [], "outputs": [{"name": "", "type": "uint256"}], "payable": false, "stateMutability": "view", "type": "function"},
    {"name": "getStamper", "constant": true, "inputs": [{"name": "record", "type": "bytes32"}], "outputs": [{"name": "", "type": "address"}], "payable": false, "type": "function"}
  ];
  proto.networks =  [
    ,
    'mainnet',
    'morden',
    'ropsten',
    'rinkeby'
  ], proto.networks[42] = 'kovan'
  proto.balance = {c:[]}
  proto.View = BLKCC_Notary_View;
}
