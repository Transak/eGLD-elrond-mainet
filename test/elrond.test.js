const elrondLib = require("../index");
const { expect, assert } = require("chai");
require("dotenv").config({ path: `${__dirname}/.env` });
/*
invalid chain id
 */
// variables
const mainTimeout = 14000;
const testData = {
    toWalletAddress: process.env.TOWALLETADDRESS,
    network: process.env.NETWORK,
    keyStore: process.env.KEYSTORE,
    password: process.env.PASSWORD,
    amount: 0.00005,
    identifier: "ZPAY-eb1ced",
    decimals_ESDT: 18,
};
if (!testData.keyStore || !testData.password) throw new Error("Invalid keyStore or password");

const runtime = {};

const keys = {
    sendTransaction: ["amount", "date", "from", "gasCostCryptoCurrency", "gasCostInCrypto", "gasLimit", "gasPrice", "network", "nonce", "to", "transactionHash", "transactionLink"],
    getTransaction: [
        "amount",
        "date",
        "from",
        "gasCostCryptoCurrency",
        "gasCostInCrypto",
        "gasLimit",
        "gasPrice",
        "isPending",
        "isExecuted",
        "isSuccessful",
        "isFailed",
        "isInvalid",
        "network",
        "nonce",
        "to",
        "tokenIdentifier",
        "transactionHash",
        "transactionLink",
    ],
};

// validate object by all it's keys
const allKeys = (result, keys) => {
    for (let key in keys) {
        expect(result).to.have.property(keys[key].name);
    }
};

describe("eGLD-elrond-mainet module", () => {
    it("should getBalance egld", async function() {
        this.timeout(mainTimeout * 3);
        const result = await elrondLib.getBalance(testData.toWalletAddress, testData.network);
        console.log({ balance: result });
        expect(typeof result === "number");
    });

    it("should getBalance esdt", async function() {
        this.timeout(mainTimeout * 3);
        const result = await elrondLib.getBalance(testData.toWalletAddress, testData.network, {tokenIdentifier: testData.identifier, decimals:testData.decimals_ESDT});
        console.log({ balance: result });
        expect(typeof result === "number");
    });

    it("should isValidWalletAddress", async function() {
        this.timeout(mainTimeout * 3);
        const result = await elrondLib.isValidWalletAddress(testData.toWalletAddress, testData.network);
        expect(result === true);
    });

    it("should sendTransaction", async function() {
        this.timeout(mainTimeout * 3);
        const { toWalletAddress: to, keyStore, password, network, amount } = testData;

        const result = await elrondLib.sendTransaction({
            to,
            amount,
            network,
            keyStore,
            password,
        });
        console.log(result);
        assert.hasAllKeys(result.receipt, keys.sendTransaction);
        runtime.transactionHash = result.receipt.transactionHash;
    });

    it("should getTransaction", async function() {
        this.timeout(mainTimeout * 3);
        console.log("NORMAl \n \n");
        const { network } = testData;
        const result = await elrondLib.getTransaction(runtime.transactionHash, network);
        assert.hasAllKeys(result.receipt, keys.getTransaction);
    });

    it("should sendTransaction ESDT", async function() {
        this.timeout(mainTimeout * 3);
        const { toWalletAddress: to, keyStore, password, network, amount, identifier, decimals_ESDT } = testData;

        const result = await elrondLib.sendTransaction({
            to,
            amount,
            network,
            keyStore,
            password,
            tokenIdentifier: identifier,
            decimals: decimals_ESDT,
        });
        console.log(result);
        assert.hasAllKeys(result.receipt, keys.sendTransaction);
        runtime.transactionHashEsdt = result.receipt.transactionHash;
    });

    it("should getTransaction ESDT", async function() {
        this.timeout(mainTimeout * 3);
        console.log("ESDT \n\n");
        const { network } = testData;
        const result = await elrondLib.getTransaction(runtime.transactionHashEsdt, network);
        console.log(result);
        // console.log("contractResults")
        // console.log(result.transactionData.contractResults)
        // console.log("logs")
        // console.log(result.transactionData.logs.events[0])
        assert.hasAllKeys(result.receipt, keys.getTransaction);
    });
});
