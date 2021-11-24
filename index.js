const config = require('./config');
const BigNumber = require('bignumber.js');
const {ProxyProvider, BackendSigner, Account, GasLimit, TransactionHash, TransactionPayload, NetworkConfig, Transaction, Address, Balance} = require("@elrondnetwork/erdjs");
const timeOut = 20000;

const _toDecimal = (amount, decimals) => {
    return new BigNumber(amount).div(`1e${decimals}`).toString(10);
}
const _createSigner = (keyStore, password) => {
    if (!keyStore) throw new Error('keyStore is undefined')
    if (!password) throw new Error('password is undefined')
    try {
        const keyFileObject = JSON.parse(keyStore);
        const signer = BackendSigner.fromWalletKey(keyFileObject, password);

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

async function getBalance(address, network) {
    try {
        let networkDetails = config.networks.testnet;
        if (network === 'main') networkDetails = config.networks.main;
        const provider = new ProxyProvider(networkDetails.provider, timeOut);
        address = new Address(address);
        const account = await provider.getAccount(address);
        const balance = account.balance;
        const rawBalance = balance.raw();
        if (rawBalance) return Number(_toDecimal(rawBalance, 18));
        else return 0;
    } catch (e) {
        console.error(e)
        return false;
    }
}

async function isValidWalletAddress(address, network) {
    try {
        let networkDetails = config.networks.testnet;
        if (network === 'main') networkDetails = config.networks.main;
        const provider = new ProxyProvider(networkDetails.provider, timeOut);
        address = new Address(address);
        if (!address) return false;
        else return true;
    } catch (e) {
        return false;
    }
}

async function getTransaction(hash, network) {
    let response = false;
    try {
        if (hash) {
            let networkDetails = config.networks.testnet;
            if (network === 'main') networkDetails = config.networks.main;

            const provider = new ProxyProvider(networkDetails.provider, timeOut);
            const txnHash = new TransactionHash(hash);
            const transaction = await provider.getTransaction(txnHash);
            transaction.value = Number(_toDecimal(transaction.value.raw(), 18))
            if (transaction) {
                response = {
                    transactionData: transaction,
                    receipt: {
                        date: new Date(),
                        transactionHash: hash,
                        transactionLink: networkDetails.transactionLink(hash),
                        network: networkDetails.networkName,
                        gasPrice: transaction.gasPrice.value,
                        gasLimit: transaction.gasLimit.value,
                        gasCostInCrypto: Number(_toDecimal((transaction.gasPrice.value * transaction.gasLimit.value), 18)),
                        gasCostCryptoCurrency: 'EGLD',
                        amount: transaction.value,
                        isExecuted: transaction.status.isExecuted(),
                        isSuccessful: transaction.status.isSuccessful(),
                        isFailed: transaction.status.isFailed(),
                        isInvalid: transaction.status.isInvalid(),
                        isPending: transaction.status.isPending(),
                        from: transaction.sender.bech32(),
                        to: transaction.receiver.bech32(),
                        nonce: transaction.nonce.value
                    }
                }
            }
        }
        return response
    } catch (e) {
        console.log(e)
        // throw(e.message)
    }
}

async function sendTransaction({to, amount, network, keyStore, password}) {
    try {
        //Set network
        let networkDetails = config.networks.testnet;
        if (network === 'main') networkDetails = config.networks.main;

        //Set provider
        const provider = new ProxyProvider(networkDetails.provider, timeOut);
        await NetworkConfig.getDefault().sync(provider);

        //get signer data using key
        const signer = _createSigner(keyStore, password);
        const sender = new Account(signer.getAddress());
        await sender.sync(provider);

        //Check balance
        const currentBalance = Number(_toDecimal(sender.balance.raw(), 18));
        if (currentBalance < amount) throw new Error('Insufficient balance in eGLD wallet')

        //Set transaction config
        const nonce = sender.nonce;
        const receiver = new Address(to);
        const value = Balance.eGLD(amount);
        const payload = new TransactionPayload("");
        const gasLimit = GasLimit.forTransfer(payload);

        const transaction = new Transaction({
            nonce: nonce,
            receiver: receiver,
            value: value,
            data: payload,
            gasLimit: gasLimit
        });

        signer.sign(transaction);
        await transaction.send(provider);

        return {
            transactionData: transaction,
            receipt: {
                date: new Date(),
                transactionHash: transaction.hash.hash,
                transactionLink: networkDetails.transactionLink(transaction.hash.hash),
                network: networkDetails.networkName,
                gasPrice: transaction.gasPrice.value,
                gasLimit: transaction.gasLimit.value,
                gasCostInCrypto: Number(_toDecimal((transaction.gasPrice.value * transaction.gasLimit.value), 18)),
                gasCostCryptoCurrency: 'EGLD',
                amount: Number(_toDecimal(transaction.value.raw(), 18)),
                from: transaction.sender.bech32(),
                to: transaction.receiver.bech32(),
                nonce: transaction.nonce.value
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