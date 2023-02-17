module.exports = {
    networks: {
        main: {
            provider: "https://gateway.multiversx.com",
            transactionLink: (hash) => `https://explorer.multiversx.com/transactions/${hash}`,
            walletLink: (address) => `https://explorer.multiversx.com/address/${address}`,
            networkName: "main",
        },
        testnet: {
            provider: "https://testnet-gateway.multiversx.com",
            transactionLink: (hash) => `https://testnet-explorer.multiversx.com/transactions/${hash}`,
            walletLink: (address) => `https://testnet-explorer.multiversx.com/address/${address}`,
            networkName: "testnet",
        },
    },
};