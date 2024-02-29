const config = require('./config');
const { Address, Transaction, Account, TransactionHash } = require("@elrondnetwork/erdjs");
const { ProxyNetworkProvider } = require("@elrondnetwork/erdjs-network-providers");
const timeout = 20000;
const _ = require('lodash');
const {consoleError, _toDecimal, _createSigner, _getTokenTransferred, _getPayload} = require("./utils");
const {getTransactionLinkParams ,getWalletLinkParams, getBalanceParams, getTransactionParams, sendTransactionParams} = require("./validator");

function getTransactionLink(txId, network) {
    const {error} = getTransactionLinkParams.validate({txId, network});
    if (error) {
        throw new Error(`${error.message}`)
    }

   let networkDetails = config.networks.testnet;
    if (network === 'main') networkDetails = config.networks.main;
    return networkDetails.transactionLink(txId);
}

function getWalletLink(walletAddress, network) {
    const {error} = getWalletLinkParams.validate({walletAddress, network});
    if (error) {
        throw new Error(`${error.message}`)
    }

    let networkDetails = config.networks.testnet;
    if (network === 'main') networkDetails = config.networks.main;
    return networkDetails.walletLink(walletAddress);
}

/**
 * 
 * @param {string} address 
 * @param {string} network 
 * @param {*} param2 - object
 * - {string} tokenIdentifier - optional
 * - {number} decimals - optional
 * @returns 
 */
async function getBalance(address, network, {tokenIdentifier, decimals}={}) {
    const {error} = getBalanceParams.validate({address, network, options:{tokenIdentifier, decimals}});
    if (error) {
        throw new Error(`${error.message}`)
    }
    try {
        let networkDetails = config.networks.testnet;
        if (network === 'main') networkDetails = config.networks.main;
        const provider = new ProxyNetworkProvider(networkDetails.provider, {timeout});
        address = new Address(address);
        const account = await provider.getAccount(address);
        if (tokenIdentifier) { 
            try {
                rawBalance  = (await provider.getFungibleTokenOfAccount(address, tokenIdentifier)).balance.toString()
            } catch (e) {
                consoleError({message: e.message,err: e,tags:{method: "getBalance"}})
                rawBalance = "0"; 
            }
        }
        else {
            rawBalance = account.balance;
            decimals = 18
        }
         
        if (rawBalance) return Number(_toDecimal(rawBalance, decimals));
    } catch (e) {
        consoleError({message: e.message, err: e, tags:{method: "getBalance"}})
        return false;
    }
}

/**
 * 
 * @param {string} walletAddress
 * @param {string} network 
 * @returns {bool} true if address is valid, false otherwise
 */
async function isValidWalletAddress(walletAddress, network) {
    const {error} = getWalletLinkParams.validate({walletAddress, network});
    if (error) {
        throw new Error(`${error.message}`)
    }
    try {
        let networkDetails = config.networks.testnet;
        if (network === 'main') networkDetails = config.networks.main;
        address = new Address(walletAddress);
        if (!address) return false;
        else return true;
    } catch (e) {
        return false;
    }
}



async function getTransaction(hash, network, decimals=18) {
    const {error} = getTransactionParams.validate({hash, network, decimals});
    if (error) {
        throw new Error(`${error.message}`)
    }
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
            
            const {tranferedTokens, identifier} =  _getTokenTransferred({transactionData: transaction, decimals: decimals})
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
        consoleError({message: e.message, err: e, tags: {method: "getTransaction"}})
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
 * - {string} tokenIdentifier - token identifier
 * - {number} decimals - token decimals
 * @returns {object} - { transactionData , receipt}
 */
async function sendTransaction({to, amount, network, keyStore, password, tokenIdentifier, decimals}) {
    const {error} = sendTransactionParams.validate({to, amount, network, keyStore, password, options: {tokenIdentifier, decimals}});
    if (error) {
        throw new Error(`${error.message}`)
    }
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
        const {tranferedTokens} =  _getTokenTransferred({transactionData: transaction, decimals: decimals})
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
        consoleError({message:e.message,err: e,tags: {method: "sendTransaction"}})
        throw(e)
    }
}


async function getGasCost({ network, amount, tokenIdentifier, decimals }) {
    const { payload, payment, gasLimit } = _getPayload({
      identifier: tokenIdentifier,
      amount,
      decimals,
    });
  
    let networkDetails = config.networks.testnet;
    if (network === "main") networkDetails = config.networks.main;
    const provider = new ProxyNetworkProvider(networkDetails.provider, {
      timeout,
    });
    const networkConfig = await provider.getNetworkConfig();
  
    return {
      gasLimit,
      gasCostInCrypto: Number(
        _toDecimal(gasLimit * networkConfig.MinGasPrice, decimals)
      ),
      gasCostCryptoCurrency: "EGLD",
    };
  }

module.exports = {
    getTransactionLink,
    getWalletLink,
    getTransaction,
    isValidWalletAddress,
    sendTransaction,
    getBalance,
    getGasCost
};