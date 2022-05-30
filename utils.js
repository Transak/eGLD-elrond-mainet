const BigNumber = require('bignumber.js');
const { TransactionDecoder, TransactionMetadata} = require("@elrondnetwork/transaction-decoder");
const { TransactionPayload, ESDTTransferPayloadBuilder, } = require("@elrondnetwork/erdjs");
const { TokenPayment} = require("@elrondnetwork/erdjs");
const { UserSigner } = require("@elrondnetwork/erdjs-walletcore");
const assert = require("assert");
const _ = require("lodash");
const consoleError = ({ message, err, tags }) => {
    const error = new Error(message);
    error.extra = JSON.stringify(err);
    error.tags = {
        area: "crypto_coverage",
        blockchain: "elrond",
        ...(tags || {}),
    };
    console.log(error);
};

const _toDecimal = (amount, decimals) => {
    return new BigNumber(amount).div(`1e${decimals}`).toString(10);
};

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

/**
 * 
 * @param {object} parameters {transactionData, decimals}
 * -  {object} transactionData - transaction data object
 * - {number} decimals - token decimals
 * @returns {object} {amount : {Number}, tokenIdentifier: {string}}
 */
 function _getTokenTransferred({transactionData, decimals}) {
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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    consoleError,
    _toDecimal,
    _createSigner,
    _getTokenTransferred,
    _getPayload,
    sleep
};
