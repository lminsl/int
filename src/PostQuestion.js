import React, { useState } from 'react';

const PostQuestion = ({ tigercoinContract, account, web3 }) => {
    const [question, setQuestion] = useState('');
    const [tokensToFeature, setTokensToFeature] = useState('');

    const postQuestion = async () => {
        try {
            console.log("Attempting to post question");

            // Use the `web3` instance from props instead of `window.web3`
            const tokenAmount = web3.utils.toWei(tokensToFeature, 'ether');
            console.log("Token amount to spend:", tokenAmount);

            await tigercoinContract.methods.spendToFeature(account, tokenAmount).send({ from: account });
            console.log("Question posted with featured amount:", tokensToFeature);

            setQuestion('');
            setTokensToFeature('');
        } catch (error) {
            console.error("Error posting question:", error);
        }
    };

    return (
        <div>
            <h2>Post a New Question</h2>
            <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Your question"
            />
            <input
                type="number"
                value={tokensToFeature}
                onChange={(e) => setTokensToFeature(e.target.value)}
                placeholder="Tokens to feature"
            />
            <button onClick={postQuestion}>Post Question</button>
        </div>
    );
};

export default PostQuestion;
