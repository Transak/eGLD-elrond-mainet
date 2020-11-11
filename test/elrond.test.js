const elrondLib = require('../index');
const {expect, assert} = require('chai');

/*
invalid chain id
 */
// variables
const mainTimeout = 14000;
const testData = {
    toWalletAddress: 'erd1qr5exrfd6nvw9cwrg5av337e6zjzylf95yg00mnz9tlqjmugjy4qskprl9',
    network: 'main',
    keyStore: ``,
    password: '',
    amount: 0.00005
};

if (!testData.keyStore || !testData.password) throw new Error('Invalid keyStore or password')

const runtime = {};


const keys = {
    sendTransaction: [
        "amount",
        "date",
        "from",
        "gasCostCryptoCurrency",
        "gasCostInCrypto",
        "gasLimit",
        "gasPrice",
        "network",
        "nonce",
        "to",
        "transactionHash",
        "transactionLink"
    ],
    getTransaction : [
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
        "transactionHash",
        "transactionLink"
    ]
};

// validate object by all it's keys
const allKeys = (result, keys) => {
    for (let key in keys) {
        expect(result).to.have.property(keys[key].name);
    }
};

describe("eGLD-elrond-mainet module", () => {

    it("should getBalance", async function () {
        this.timeout(mainTimeout * 3);
        const result = await elrondLib.getBalance(testData.toWalletAddress, testData.network);
        expect(typeof result === "number");
    });

    it("should isValidWalletAddress", async function () {
        this.timeout(mainTimeout * 3);
        const result = await elrondLib.isValidWalletAddress(testData.toWalletAddress, testData.network);
        expect(result === true);
    });

    it("should sendTransaction", async function () {
        this.timeout(mainTimeout * 3);
        const {
            toWalletAddress: to,
            keyStore,
            password,
            network,
            amount
        } = testData;

        const result = await elrondLib.sendTransaction({
            to,
            amount,
            network,
            keyStore, password
        });
        assert.hasAllKeys(result.receipt, keys.sendTransaction);
        runtime.transactionHash = result.receipt.transactionHash;
    });

    it("should getTransaction", async function () {
        this.timeout(mainTimeout * 3);
        const {
            network,
        } = testData;
        const result = await elrondLib.getTransaction(runtime.transactionHash, network);
        assert.hasAllKeys(result.receipt, keys.getTransaction);
    });
});