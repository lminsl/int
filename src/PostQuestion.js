import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const PostQuestion = ({ tigercoinContract, account, web3, refreshQuestions }) => {
    const [title, setTitle] = useState(''); // New state for title
    const [question, setQuestion] = useState('');
    const [tokensToFeature, setTokensToFeature] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');


    const postQuestion = async () => {
        setErrorMessage('');
        setLoading(true);

        try {
            // Convert tokens to Wei for blockchain transaction
            const tokenAmount = web3.utils.toWei(tokensToFeature, 'ether');

            // Interact with the Tigercoin contract
            await tigercoinContract.methods.spendToFeature(account, tokenAmount).send({ from: account });

            // Send question data (including title) to the backend
            await axios.post('http://localhost:3500/api/questions', {
                title,  // Add the title field
                question,
                account,
                tokens: tokensToFeature,
                timestamp: Math.floor(Date.now() / 1000), // Add timestamp
            });

            // Refresh the questions list
            refreshQuestions();

            // Clear input fields
            setTitle('');
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
        <div class="post-question">
        <section class="question-form">
                <h2 class="section-title">Post a New Question</h2>
                <form>
                    <div class="form-group">
                        <input type="text" value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title of your question"
                            disabled = {loading} />
                    </div>
                    <div class="form-group">
                        <textarea
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Details of your question"
                            disabled={loading} />
                    </div>
                    <div class="form-group">
                        <input
                            type="number"
                            value={tokensToFeature}
                            onChange={(e) => setTokensToFeature(e.target.value)}
                            placeholder="Tokens to feature"
                            disabled={loading} />
                    </div>
                    <button class="button" onClick={postQuestion} 
                    disabled={loading || !title || !question || !tokensToFeature}>
                        {loading ? "Posting..." : "Post Question"}
                    </button>
                </form>
            </section>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
    );
};

export default PostQuestion;
