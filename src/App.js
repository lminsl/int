import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Wallet from './Wallet';
import PostQuestion from './PostQuestion';
import QuestionPage from './QuestionPage'; // Question-specific page
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
    const [stakeAmount, setStakeAmount] = useState('');
    const [validatorStatus, setValidatorStatus] = useState(false);
    const [stakedAmount, setStakedAmount] = useState(0);
    const [loading, setLoading] = useState(true);

    const decayRate = 0.00005; // Define the exponential decay rate

    const init = async () => {
        try {
            console.log("Initializing app...");
            const web3Instance = await getWeb3();
            setWeb3(web3Instance);

            const accounts = await web3Instance.eth.getAccounts();
            setAccount(accounts[0]);

            const tigercoin = new web3Instance.eth.Contract(TigercoinABI, '0xCE2cFE60c838a1008Ed6176b0d5C677F5f4990B2');
            const platform = new web3Instance.eth.Contract(TigercoinPlatformABI, '0x84C0a3752ee69609B68A45251EE4b0FD374F4795');

            setTigercoinContract(tigercoin);
            setPlatformContract(platform);

            const balance = await tigercoin.methods.balanceOf(accounts[0]).call();
            setBalance(web3Instance.utils.fromWei(balance, 'ether'));

            try {
                const owner = await platform.methods.owner().call();
                console.log('Platform Contract Owner:', owner);
            } catch (error) {
                console.error('Error connecting to Platform Contract:', error);
            }

            await fetchQuestions();
            await updateValidatorStatus(accounts[0], platform, web3Instance);

            setLoading(false);
        } catch (error) {
            console.error("Error during initialization:", error);
            setLoading(false);
        }
    };

    const computeValue = (tokens, timestamp) => {
        const timeElapsed = (Date.now() / 1000) - timestamp; // Time elapsed in seconds
        return tokens * Math.exp(-decayRate * timeElapsed); // Apply exponential decay
    };

    const fetchQuestions = async () => {
        try {
            const response = await axios.get('http://localhost:3500/api/questions');
            const sortedQuestions = response.data
                .map((q) => ({
                    ...q,
                    value: computeValue(q.tokens, q.timestamp), // Compute the value
                }))
                .sort((a, b) => b.value - a.value); // Sort by value (descending)
            setQuestions(sortedQuestions);
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    };

    const updateValidatorStatus = async (account, platform, web3Instance) => {
        try {
            const validatorInfo = await platform.methods.validators(account).call();
            setValidatorStatus(validatorInfo.isValidator);
            setStakedAmount(web3Instance.utils.fromWei(validatorInfo.stakedAmount, 'ether'));
        } catch (error) {
            console.error("Error fetching validator status:", error);
        }
    };

    const handleStake = async (web3Instance) => {
        try {
            const stakeInWei = web3Instance.utils.toWei(stakeAmount, 'ether');

            await tigercoinContract.methods
            .approve(platformContract.options.address, stakeInWei)
            .send({ from: account });

            await platformContract.methods.stakeTokens(stakeInWei).send({ from: account });
            console.log("Stake successful");

            setStakeAmount('');
            await updateValidatorStatus(account, platformContract, web3Instance);
            const balance = await tigercoinContract.methods.balanceOf(account).call();
            setBalance(web3Instance.utils.fromWei(balance, 'ether'));
        } catch (error) {
            console.error("Error staking tokens:", error);
        }
    };

    const handleUnstake = async (web3Instance) => {
        try {
            const stakedInWei = web3Instance.utils.toWei(stakedAmount, 'ether');
            await platformContract.methods.unstakeTokens(stakedInWei).send({ from: account });
            await updateValidatorStatus(account, platformContract, web3Instance);
        } catch (error) {
            console.error("Error unstaking tokens:", error);
        }
    };

    useEffect(() => {
        init();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <div className="app-container">
                <h1 className="app-title">Welcome to the Tigercoin Q&A Platform</h1>
                <Routes>
                    {/* Homepage */}
                    <Route
                        path="/"
                        element={
                            <div>
                                <div className="wallet-section">
                                    <Wallet setAccount={setAccount} setBalance={setBalance} />
                                    <p className="balance">Your Tigercoin Balance: {balance} TIGR</p>

                                    {/* Validator Status and Stake/Unstake Section */}
                                    <p>Validator Status: {validatorStatus ? "True" : "False"}</p>
                                    {validatorStatus ? (
                                        <div>
                                            <p>Staked Amount: {stakedAmount} TIGR</p>
                                            <button onClick={() => handleUnstake(web3)}>Unstake</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="number"
                                                value={stakeAmount}
                                                onChange={(e) => setStakeAmount(e.target.value)}
                                                placeholder="Amount to stake"
                                            />
                                            <button onClick={() => handleStake(web3)}>Stake</button>
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
                                            <li key={question._id} className="question-item">
                                                <Link to={`/question/${question._id}`}>
                                                    <h3>{question.title}</h3>
                                                </Link>
                                                <p>{question.question.slice(0, 100)}...</p>
                                                <p>Posted by: {question.account}</p>
                                                <p>Tokens: {question.tokens}</p>
                                                <p>Value: {question.value.toFixed(2)}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        }
                    />

                    {/* Question-specific page */}
                    <Route
                        path="/question/:id"
                        element={
                            platformContract && account && web3 ? (
                                <QuestionPage
                                    platformContract={platformContract}
                                    account={account}
                                    web3={web3}
                                    validatorStatus={validatorStatus}
                                />
                            ) : (
                                <div>Loading...</div>
                            )
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
};

export default App;