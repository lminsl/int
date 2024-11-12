// src/App.js
import React, { useEffect, useState } from 'react';
import Wallet from './Wallet';
import PostQuestion from './PostQuestion';
import PostAnswer from './PostAnswer';
import VoteOnAnswer from './VoteOnAnswer';
import TigercoinABI from './TigercoinABI.json';
import TigercoinPlatformABI from './TigercoinPlatformABI.json';
import getWeb3 from './web3';
import './App.css';
import axios from 'axios';

const App = () => {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState(0);
    const [tigercoinContract, setTigercoinContract] = useState(null);
    const [platformContract, setPlatformContract] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [stakeAmount, setStakeAmount] = useState(''); // For staking input
    const [validatorStatus, setValidatorStatus] = useState(false);
    const [stakedAmount, setStakedAmount] = useState(0);

    const init = async () => {
        console.log("Initializing app...");

        const web3Instance = await getWeb3();
        setWeb3(web3Instance);

        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);

        const tigercoin = new web3Instance.eth.Contract(TigercoinABI, '0xCE2cFE60c838a1008Ed6176b0d5C677F5f4990B2');
        const platform = new web3Instance.eth.Contract(TigercoinPlatformABI, '0x529c25393ce550A4167E2C3Ce36d73B30009afab');

        setTigercoinContract(tigercoin);
        setPlatformContract(platform);

        const balance = await tigercoin.methods.balanceOf(accounts[0]).call();
        setBalance(web3Instance.utils.fromWei(balance, 'ether'));

        // Fetch questions and update validator status
        fetchQuestions();
        updateValidatorStatus(accounts[0], platform);
    };

    // Fetches questions from the backend
    const fetchQuestions = async () => {
        try {
            const response = await axios.get('http://localhost:3500/api/questions');
            setQuestions(response.data);
            console.log("Questions fetched:", response.data);
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    };

    // Updates the validator status
    const updateValidatorStatus = async (account, platform) => {
        try {
            const validatorInfo = await platform.methods.validators(account).call();
            setValidatorStatus(validatorInfo.isValidator);
            setStakedAmount(web3.utils.fromWei(validatorInfo.stakedAmount, 'ether'));
        } catch (error) {
            console.error("Error fetching validator status:", error);
        }
    };

    // Handle staking
    const handleStake = async () => {
        try {
            const stakeInWei = web3.utils.toWei(stakeAmount, 'ether');
            await platformContract.methods.stakeTokens(stakeInWei).send({ from: account });
            setStakeAmount(''); // Clear input
            updateValidatorStatus(account, platformContract); // Refresh validator status
        } catch (error) {
            console.error("Error staking tokens:", error);
        }
    };

    // Handle unstaking
    const handleUnstake = async () => {
        try {
            const stakedInWei = web3.utils.toWei(stakedAmount, 'ether');
            await platformContract.methods.unstakeTokens(stakedInWei).send({ from: account });
            updateValidatorStatus(account, platformContract); // Refresh validator status
        } catch (error) {
            console.error("Error unstaking tokens:", error);
        }
    };

    useEffect(() => { init(); }, []);

    return (
        <div className="app-container">
            <h1 className="app-title">Welcome to the Tigercoin Q&A Platform</h1>
            <div className="wallet-section">
                <Wallet setAccount={setAccount} setBalance={setBalance} />
                <p className="balance">Your Tigercoin Balance: {balance} TIGR</p>

                {/* Validator Status and Stake/Unstake Section */}
                <p>Validator Status: {validatorStatus ? "True" : "False"}</p>
                {validatorStatus ? (
                    <div>
                        <p>Staked Amount: {stakedAmount} TIGR</p>
                        <button onClick={handleUnstake}>Unstake</button>
                    </div>
                ) : (
                    <div>
                        <input
                            type="number"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            placeholder="Amount to stake"
                        />
                        <button onClick={handleStake}>Stake</button>
                    </div>
                )}
            </div>

            {web3 && account && tigercoinContract && (
                <PostQuestion
                    tigercoinContract={tigercoinContract}
                    account={account}
                    web3={web3}
                    refreshQuestions={fetchQuestions}
                />
            )}
            
            <div className="questions-section">
                <h2>Questions:</h2>
                <ul>
                    {questions.map((question) => (
                        <li key={question._id}>
                            <p><strong>{question.question}</strong></p>
                            <p>Account: {question.account}</p>
                            <p>Tokens: {question.tokens}</p>

                            {/* Post an Answer for each question */}
                            <PostAnswer
                                platformContract={platformContract}
                                questionId={question._id}
                                account={account}
                                web3={web3}
                            />

                            {/* Voting section for each answer */}
                            <VoteOnAnswer
                                platformContract={platformContract}
                                answerId={question._id}
                                account={account}
                                stakeAmount={balance}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default App;
