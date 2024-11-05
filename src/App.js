// src/App.js
import React, { useEffect, useState } from 'react';
import Wallet from './Wallet';
import PostQuestion from './PostQuestion';
import TigercoinABI from './TigercoinABI.json';
import getWeb3 from './web3';
import './App.css';
import axios from 'axios';

const App = () => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState(0);
    const [tigercoinContract, setTigercoinContract] = useState(null);
    const [questions, setQuestions] = useState([]); // State to hold questions

    const init = async () => {
        console.log("Initializing app...");

        const web3Instance = await getWeb3();
        setWeb3(web3Instance);

        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);

        const contract = new web3Instance.eth.Contract(TigercoinABI, '0xCE2cFE60c838a1008Ed6176b0d5C677F5f4990B2');
        setTigercoinContract(contract);

        const balance = await contract.methods.balanceOf(accounts[0]).call();
        setBalance(web3Instance.utils.fromWei(balance, 'ether'));

        const response = await axios.get('http://localhost:3500/api/questions');
        console.log("Questions fetched:", response.data);
        setQuestions(response.data); // Update the state with the fetched questions
    };

    useEffect(() => {init();}, []);

    return (
        <div className="app-container">
        <h1 className="app-title">Welcome to the Tigercoin Q&A Platform</h1>
        <div className="wallet-section">
            <Wallet setAccount={setAccount} setBalance={setBalance} />
            <p className="balance">Your Tigercoin Balance: {balance} TIGR</p>
        </div>
        {web3 && account && tigercoinContract && (
            <PostQuestion tigercoinContract={tigercoinContract} account={account} web3={web3} onTrigger={init} />
        )}
        
        <div className="questions-section">
        <h2>Questions:</h2>
        <ul>
            {questions.map((question, index) => (
                <li key={index}>
                    <p><strong>{question.question}</strong></p>
                    <p>Account: {question.account}</p>
                    <p>Tokens: {question.tokens}</p>
                </li>
            ))}
        </ul>
    </div>
    </div>
    );
};

export default App;
