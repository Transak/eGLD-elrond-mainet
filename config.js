module.exports = {
    networks : {
        main: {
            provider: 'https://api.elrond.com',
            transactionLink : (hash) => `https://explorer.elrond.com/transactions/${hash}`,
            walletLink : (address) => `https://explorer.elrond.com/address/${address}`,
            networkName: 'main',

        },
        testnet: {
            provider: 'https://api-testnet.elrond.com',
            transactionLink : (hash) => `https://testnet-explorer.elrond.com/transactions/${hash}`,
            walletLink : (address) => `https://testnet-explorer.elrond.com/address/${address}`,
            networkName: 'testnet',
        }
    }
}