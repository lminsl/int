import React, { useState } from 'react';
import axios from 'axios';

const PostAnswer = ({ platformContract, questionId, account, web3 }) => {
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handlePostAnswer = async () => {
        setErrorMessage('');
        setLoading(true);

        try {
            // Ensure questionId is correctly formatted
            const formattedQuestionId = questionId.startsWith("0x") ? questionId : `0x${questionId}`;

            // Interact with the smart contract
            await platformContract.methods.postAnswer(formattedQuestionId).send({
                from: account,
            });
            console.log("Answer posted on blockchain successfully");

            // Post answer to the backend
            const response = await axios.post('http://localhost:3500/api/answers', {
                questionId,       // ID of the related question
                answer,           // Text of the answer
                expert: account,  // The expert's wallet address
                rewardEscrow: 0,  // Optional: Set reward escrow or calculate if needed
            });

            console.log("Answer saved in backend successfully:", response.data);
            setAnswer(''); // Clear the input after successful submission
        } catch (error) {
            console.error("Error posting answer:", error);
            setErrorMessage("There was an error posting your answer. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer"
                disabled={loading}
            />
            <button onClick={handlePostAnswer} disabled={loading || !answer}>
                {loading ? "Posting..." : "Post Answer"}
            </button>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
    );
};

export default PostAnswer;
