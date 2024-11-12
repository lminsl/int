import React, { useState } from 'react';
import axios from 'axios'; // Make sure axios is installed with "npm install axios"

const PostQuestion = ({ tigercoinContract, account, web3, refreshQuestions }) => {
    const [question, setQuestion] = useState('');
    const [tokensToFeature, setTokensToFeature] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const postQuestion = async () => {
        setErrorMessage('');
        setLoading(true);

        try {
            console.log("Attempting to post question");

            // Convert tokens to Wei for blockchain transaction
            const tokenAmount = web3.utils.toWei(tokensToFeature, 'ether');
            console.log("Token amount to spend:", tokenAmount);

            // Interact with the Tigercoin contract
            await tigercoinContract.methods.spendToFeature(account, tokenAmount).send({ from: account });
            console.log("Question posted with featured amount:", tokensToFeature);

            // Send question data to the backend
            await axios.post('http://localhost:3500/api/questions', {
                question: question,
                account: account,
                tokens: tokensToFeature,
            });

            console.log("Question successfully posted to backend");

            // Refresh the questions list on the main page
            refreshQuestions();

            // Clear the input fields only after successful submission
            setQuestion('');
            setTokensToFeature('');
        } catch (error) {
            console.error("Error posting question:", error);
            setErrorMessage("There was an error posting your question. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post-question">
            <h2>Post a New Question</h2>
            <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Your question"
                disabled={loading}
            />
            <input
                type="number"
                value={tokensToFeature}
                onChange={(e) => setTokensToFeature(e.target.value)}
                placeholder="Tokens to feature"
                disabled={loading}
            />
            <button onClick={postQuestion} disabled={loading || !question || !tokensToFeature}>
                {loading ? "Posting..." : "Post Question"}
            </button>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
    );
};

export default PostQuestion;