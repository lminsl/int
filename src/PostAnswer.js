/* global BigInt */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const PostAnswer = ({ platformContract, questionId, account, web3, stakeAmount }) => {
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [hasAnswer, setHasAnswer] = useState(false);

    // Check if an answer already exists for the question
    useEffect(() => {
        const checkForExistingAnswer = async () => {
            try {
                const response = await axios.get(`http://localhost:3500/api/questions/${questionId}/answers`);
                if (response.data.length > 0) {
                    setHasAnswer(true); // Answer already exists
                }
            } catch (error) {
                console.error("Error checking for existing answers:", error);
                setErrorMessage("Failed to verify if an answer exists.");
            }
        };

        checkForExistingAnswer();
    }, [questionId]);

    const handlePostAnswer = async () => {
        setErrorMessage('');
        setLoading(true);

        try {
            // Ensure questionId is correctly formatted
            const formattedQuestionId = BigInt(`0x${questionId}`).toString();

            // Interact with the smart contract
            await platformContract.methods.postAnswer(formattedQuestionId, stakeAmount).send({
                from: account,
            });
            console.log("Answer posted on blockchain successfully");

            // Post answer to the backend
            const response = await axios.post('http://localhost:3500/api/answers', {
                questionId: questionId, // Ensure it matches the backend API expectation
                answer, // Text of the answer
                expert: account, // The expert's wallet address
                rewardEscrow: 0, // Optional: Set reward escrow or calculate if needed
            });

            console.log("Answer saved in backend successfully:", response.data);
            setAnswer(''); // Clear the input after successful submission
            setHasAnswer(true); // Mark that an answer now exists
        } catch (error) {
            console.error("Error posting answer:", error);
            setErrorMessage("There was an error posting your answer. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div class="response-box">
            {hasAnswer ? (
                <p>You have already posted an answer for this question.</p>
            ) : (
                <>  
                    <br />
                    <h2>Post an Answer</h2>
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Your answer"
                        disabled={loading}
                    />
                    <button class="button" onClick={handlePostAnswer} disabled={loading || !answer}>
                        {loading ? "Posting..." : "Post Answer"}
                    </button>
                </>
            )}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
    );
};

export default PostAnswer;