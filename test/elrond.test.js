const elrondLib = require("../index");
const { assert } = require("chai");
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

describe("eGLD-elrond-mainet module", () => {
    it("should getBalance egld", async function() {
        this.timeout(mainTimeout * 3);
        const result = await elrondLib.getBalance(testData.toWalletAddress, testData.network);
        assert(typeof result === "number", "result should be a number");
    });

    it("should getBalance esdt", async function() {
        this.timeout(mainTimeout * 3);
        const result = await elrondLib.getBalance(testData.toWalletAddress, testData.network, {tokenIdentifier: testData.identifier, decimals:testData.decimals_ESDT});
        assert(typeof result === "number", "result should be a number");
    });

    it("should isValidWalletAddress", async function() {
        this.timeout(mainTimeout * 3);
        const result = await elrondLib.isValidWalletAddress(testData.toWalletAddress, testData.network);
        assert(result=== true && typeof result === "boolean", "result should be true");
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
        assert.hasAllKeys(result.receipt, keys.sendTransaction);
        runtime.transactionHash = result.receipt.transactionHash;
    });

    it("should getTransaction", async function() {
        this.timeout(mainTimeout * 3);
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
        assert.hasAllKeys(result.receipt, keys.sendTransaction);
        runtime.transactionHashEsdt = result.receipt.transactionHash;
    });

    it("should getTransaction ESDT", async function() {
        this.timeout(mainTimeout * 3);
        const { network } = testData;
        const result = await elrondLib.getTransaction(runtime.transactionHashEsdt, network);
        assert.hasAllKeys(result.receipt, keys.getTransaction);
    });

    it("should get GasEstimate", async function () {
        this.timeout(mainTimeout * 3);
        const { network, amount, identifier, decimals_ESDT: decimals } = testData;
        const result = await elrondLib.getGasCost({
          amount,
          network,
          decimals,
          tokenIdentifier: identifier,
        });
        console.log(result)
        assert(typeof result.gasCostInCrypto === "number", "gasCostInCrypto should be a number");
      });
});
