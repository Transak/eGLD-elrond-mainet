module.exports = {
    networks : {
        main: {
            provider: 'https://gateway.elrond.com',
            transactionLink : (hash) => `https://explorer.elrond.com/transactions/${hash}`,
            walletLink : (address) => `https://explorer.elrond.com/address/${address}`,
            networkName: 'main',

        },
        testnet: {
            provider: 'https://testnet-gateway.elrond.com',
            transactionLink : (hash) => `https://testnet-explorer.elrond.com/transactions/${hash}`,
            walletLink : (address) => `https://testnet-explorer.elrond.com/address/${address}`,
            networkName: 'testnet',
        }
    }
}