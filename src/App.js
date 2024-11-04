// src/App.js
import React, { useEffect, useState } from 'react';
import Wallet from './Wallet';
import PostQuestion from './PostQuestion';
import TigercoinABI from './TigercoinABI.json';
import getWeb3 from './web3';
import './App.css';

const App = () => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState(0);
    const [tigercoinContract, setTigercoinContract] = useState(null);

    useEffect(() => {
        const init = async () => {
            const web3Instance = await getWeb3();
            setWeb3(web3Instance);

            const accounts = await web3Instance.eth.getAccounts();
            setAccount(accounts[0]);

            const contract = new web3Instance.eth.Contract(TigercoinABI, '0xCE2cFE60c838a1008Ed6176b0d5C677F5f4990B2');
            setTigercoinContract(contract);

            const balance = await contract.methods.balanceOf(accounts[0]).call();
            setBalance(web3Instance.utils.fromWei(balance, 'ether'));
        };

        init();
    }, []);

    return (
        <div className="app-container">
        <h1 className="app-title">Welcome to the Tigercoin Q&A Platform</h1>
        <div className="wallet-section">
            <Wallet setAccount={setAccount} setBalance={setBalance} />
            <p className="balance">Your Tigercoin Balance: {balance} TIGR</p>
        </div>
        {web3 && account && tigercoinContract && (
            <PostQuestion tigercoinContract={tigercoinContract} account={account} web3={web3} />
        )}
        </div>
    );
};

export default App;
