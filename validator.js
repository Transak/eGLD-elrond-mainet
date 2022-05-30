const Joi = require("joi");

const getTransactionLinkParams = Joi.object()
    .keys({
        txId: Joi.string().required().description("txId is required"),
        network: Joi.string().required().description("network is required"),
    })
    .unknown();

const getWalletLinkParams = Joi.object()
    .keys({
        walletAddress: Joi.string().required().description("walletAddress is required"),
        network: Joi.string().required().description("network is required"),
    })
    .unknown();

const _identifierDecimalValidator = Joi.object()
    .keys({
        tokenIdentifier: Joi.string().allow(null).description("tokenIdentifier is optional"),
        decimals: Joi.number().integer().allow(null).description("decimals is optional"),
    })
    .unknown()
    .with("tokenIdentifier", "decimals");

const getBalanceParams = Joi.object()
    .keys({
        address: Joi.string().required().description("address is required"),
        network: Joi.string().required().description("network is required"),
        options: _identifierDecimalValidator,
    })
    .unknown();

const getTransactionParams = Joi.object()
    .keys({
        hash: Joi.string().required().description("hash is required"),
        network: Joi.string().required().description("network is required"),
        decimals: Joi.number().integer().allow(null).description("decimals is optional"),
    })
    .unknown();

const sendTransactionParams = Joi.object()
    .keys({
        to: Joi.string().required().description("to is required"),
        amount: Joi.number().required().description("amount is required"),
        network: Joi.string().required().description("network is required"),
        keyStore: Joi.string().required().description("keyStore is required"),
        password: Joi.string().required().description("password is required"),
        options: _identifierDecimalValidator,
    })
    .unknown();

module.exports = {
    getTransactionLinkParams,
    getWalletLinkParams,
    getBalanceParams,
    getTransactionParams,
    sendTransactionParams,
};
