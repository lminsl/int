import Web3 from 'web3';

const getWeb3 = () => {
  return new Promise((resolve, reject) => {
    window.addEventListener('load', async () => {
      if (window.ethereum) {
        // Modern dapp browsers (MetaMask)
        const web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      } else {
        // Fallback to localhost; use in development
        const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
        const web3 = new Web3(provider);
        console.log('No MetaMask detected, using local provider');
        resolve(web3);
      }
    });
  });
};

export default getWeb3;
