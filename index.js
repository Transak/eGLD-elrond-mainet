const config = require('./config');
const BigNumber = require('bignumber.js');
const { TransactionPayload, ESDTTransferPayloadBuilder, } = require("@elrondnetwork/erdjs");
const { TokenPayment, Address, Transaction, Account, TransactionHash, USER } = require("@elrondnetwork/erdjs");
const { ProxyNetworkProvider } = require("@elrondnetwork/erdjs-network-providers");
const { TransactionDecoder, TransactionMetadata} = require("@elrondnetwork/transaction-decoder");
const { UserSigner } = require("@elrondnetwork/erdjs-walletcore");
const timeout = 20000;
const _ = require('lodash');
const { assert } = require('chai');
const _toDecimal = (amount, decimals) => {
    return new BigNumber(amount).div(`1e${decimals}`).toString(10);
}

/**
 * 
 * @param {string} keyStore     
 * @param {string} password 
 * @returns {UserSigner} signer object
 */
const _createSigner = (keyStore, password) => {
    if (!keyStore) throw new Error('keyStore is undefined')
    if (!password) throw new Error('password is undefined')
    try {
        const keyFileObject = JSON.parse(keyStore);
        const signer = UserSigner.fromWallet(keyFileObject, password);
        return signer;
    } catch (e) {
        console.error(e)
        throw new Error('Invalid keyStore or password')
    }
}

function getTransactionLink(txId, network) {
    let networkDetails = config.networks.testnet;
    if (network === 'main') networkDetails = config.networks.main;
    return networkDetails.transactionLink(txId);
}

function getWalletLink(walletAddress, network) {
    let networkDetails = config.networks.testnet;
    if (network === 'main') networkDetails = config.networks.main;
    return networkDetails.walletLink(walletAddress);
}

async function getBalance(address, network, {tokenIdentifier, decimals}={}) {
    if(tokenIdentifier) assert.ok(_.isNumber(decimals), "decimals required if identifier provided in options")
    try {
        let networkDetails = config.networks.testnet;
        if (network === 'main') networkDetails = config.networks.main;
        const provider = new ProxyNetworkProvider(networkDetails.provider, {timeout});
        address = new Address(address);
        const account = await provider.getAccount(address);
      

        if (tokenIdentifier && decimals) { 
            try {
                rawBalance  = (await provider.getFungibleTokenOfAccount(address, tokenIdentifier)).balance.toString()
            } catch (e) {
                console.error(e)
                rawBalance = "0"; 
            }
        }
        else {
            rawBalance = account.balance;
            decimals = 18
        }
         
        if (rawBalance) return Number(_toDecimal(rawBalance, decimals));
    } catch (e) {
        console.error(e)
        return false;
    }
}

/**
 * 
 * @param {string} address 
 * @param {string} network 
 * @returns  {bool} true if address is valid, false otherwise
 */
async function isValidWalletAddress(address, network) {
    try {
        let networkDetails = config.networks.testnet;
        if (network === 'main') networkDetails = config.networks.main;
        const provider = new ProxyNetworkProvider(networkDetails.provider, {timeout});
        address = new Address(address);
        if (!address) return false;
        else return true;
    } catch (e) {
        return false;
    }
}

/**
 * 
 * @param {object} parameters {transactionData, decimals}
 * -  {object} transactionData - transaction data object
 * - {number} decimals - token decimals
 * @returns {object} {amount : {Number}, tokenIdentifier: {string}}
 */
function getTokenTransferred({transactionData, decimals}) {
    const decodedTransaction = new TransactionDecoder().getTransactionMetadata(transactionData);
    let tranferedTokens, identifier;
    if (decodedTransaction.transfers && decodedTransaction.transfers.length > 0) {
        tranferedTokens = Number(_toDecimal(decodedTransaction.transfers[0].value.toString(), decimals));
        identifier= _.get(decodedTransaction.transfers[0],"properties.identifier", "");

    } else {
        tranferedTokens = Number(_toDecimal(decodedTransaction.value.toString(), decimals));
        identifier = "EGLD"
    }
    return { tranferedTokens, identifier };
}

async function getTransaction(hash, network, decimals=18) {
    let response = false;
    try {
        if (hash) {
            const EGLD_DECIMALS = 18
            let networkDetails = config.networks.testnet;
            if (network === 'main') networkDetails = config.networks.main;

            const provider = new ProxyNetworkProvider(networkDetails.provider, {timeout});
            const txnHash = new TransactionHash(hash);
            const txHashString = txnHash.toString()
            const transaction = await provider.getTransaction(txnHash);
            
            const {tranferedTokens, identifier} =  getTokenTransferred({transactionData: transaction, decimals: decimals})
            transaction.value = Number(_toDecimal(transaction.value, 18))
            if (transaction) {
                response = {
                    transactionData: transaction,
                    date: new Date(),
                    transactionHash: txHashString,
                    transactionLink: networkDetails.transactionLink(txHashString),
                    network: networkDetails.networkName,
                    gasPrice: transaction.gasPrice,
                    amount: tranferedTokens,
                    from: transaction.sender.bech32(),
                    to: transaction.receiver.bech32(),
                    nonce: transaction.nonce,
                    gasLimit: transaction.gasLimit,
                    feeCurrency: 'EGLD',
                    receipt: {
                        date: new Date(),
                        transactionHash: txHashString,
                        transactionLink: networkDetails.transactionLink(txHashString),
                        network: networkDetails.networkName,
                        gasPrice: transaction.gasPrice,
                        gasLimit: transaction.gasLimit,
                        gasCostInCrypto: Number(_toDecimal((transaction.gasPrice * transaction.gasLimit), EGLD_DECIMALS)),
                        gasCostCryptoCurrency: 'EGLD',
                        amount: tranferedTokens,
                        tokenIdentifier: identifier,
                        isExecuted: transaction.status.isExecuted(),
                        isSuccessful: transaction.status.isSuccessful(),
                        isFailed: transaction.status.isFailed(),
                        isInvalid: transaction.status.isInvalid(),
                        isPending: transaction.status.isPending(),
                        from: transaction.sender.bech32(),
                        to: transaction.receiver.bech32(),
                        nonce: transaction.nonce
                    }
                }
            }
        }
        return response
    } catch (e) {
        console.error(e)
        // throw(e.message)
    }
}


/**
 * 
 * @param {*} param0 - {identifier, amount, decimals}
 * - {string| undefined} identifier - token identifier 
 * - {number} amount - token amount
 * - {number| undefined} decimals - token decimals
 * @returns {object} - {payment : {Payment|undefined} , payload: {TransactionPayload}, transaction: {Transaction}}
 */
function _getPayload({identifier, amount, decimals}){
    assert.ok(amount, 'amount is required')
    if(identifier) assert.ok(_.isNumber(decimals), 'decimals is required')
    let payment , payload, gasLimit
    if (identifier) {
        payload = new ESDTTransferPayloadBuilder().setPayment(TokenPayment.fungibleFromAmount(identifier,amount.toString(), decimals)).build()
        gasLimit = 50000 + 1500 * payload.length() + 300000
    } else {
        payment = TokenPayment.egldFromAmount(amount.toString())
        payload =  new TransactionPayload("")
        gasLimit = 70000
    }

    return {
        payment, 
        payload, 
        gasLimit
    }
}

/**
 * 
 * @param {object} param0  -  {to, amount, network, keyStore, password, contractAddrress, tokenIdentifier, decimals}
 * - {string} to - address of the recipient
 * - {number} amount - amount of tokens to send
 * - {string} network - network name (main or testnet)
 * - {string} keyStore - keystore file content
 * - {string} password - keystore password
 * - {string} contractAddress - address of the token contract
 * - {string} tokenIdentifier - token identifier
 * - {number} decimals - token decimals
 * 
 * @returns {object} - { transactionData , receipt}
 */
async function sendTransaction({to, amount, network, keyStore, password, contractAddrress, tokenIdentifier, decimals}) {
    assert.ok(to, 'to address is required');
    assert.ok(amount, 'amount is required');
    assert.ok(network, 'network is required');
    assert.ok(keyStore, 'keyStore is required');
    assert.ok(password, 'password is required');
    if ((contractAddrress||tokenIdentifier)) assert.ok(_.isNumber(decimals), 'decimals is required if either contractAddress or identifier is supplied');
    try {
        //Set network
        let networkDetails = config.networks.testnet;
        if (network === 'main') networkDetails = config.networks.main;
        if(!_.isNumber(decimals)) decimals=18;
        
        //Set provider
        const provider = new ProxyNetworkProvider(networkDetails.provider, {timeout});
        const networkConfig = await provider.getNetworkConfig();
        
        //get signer data using key
        const signer = _createSigner(keyStore, password);
        const sender = new Account(signer.getAddress());
        const senderOnNetwork = await provider.getAccount(signer.getAddress());
        await sender.update(senderOnNetwork);
        
        //Check balance
        let currentBalance
        currentBalance = await getBalance(sender.address.bech32(), network, {tokenIdentifier,decimals})
        if (currentBalance < amount) throw new Error("Insufficient balance in eGLD wallet");
        //Set transaction config
        const nonce = sender.nonce;
        const receiver = new Address(to);
        
        
        const { payload, payment, gasLimit } = _getPayload({identifier:tokenIdentifier, amount, decimals});

        const transaction = new Transaction({
            nonce: nonce,
            receiver: receiver,
            ...(payment ? {value: payment} : {}),
            data: payload,
            gasLimit,
            chainID: networkConfig.ChainID,
        });
        signer.sign(transaction);
        const txHash = await provider.sendTransaction(transaction);
        const {tranferedTokens} =  getTokenTransferred({transactionData: transaction, decimals: decimals})
        return {
            transactionData: transaction,
            receipt: {
                date: new Date(),
                transactionHash: txHash,
                transactionLink: networkDetails.transactionLink(txHash),
                network: networkDetails.networkName,
                gasPrice: transaction.gasPrice,
                gasLimit: transaction.gasLimit,
                gasCostInCrypto: Number(_toDecimal((transaction.gasPrice * transaction.gasLimit), 18)),
                gasCostCryptoCurrency: 'EGLD',
                amount:tranferedTokens,
                from: transaction.sender.bech32(),
                to: transaction.receiver.bech32(),
                nonce: transaction.nonce
            }
        };
    } catch (e) {
        throw(e)
    }
}


module.exports = {
    getTransactionLink,
    getWalletLink,
    getTransaction,
    isValidWalletAddress,
    sendTransaction,
    getBalance,
};