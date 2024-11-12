import React, { useState } from 'react';

const PostAnswer = ({ platformContract, questionId, account, web3 }) => {
    const [answer, setAnswer] = useState('');

    const handlePostAnswer = async () => {
        try {
            // Ensure questionId has the 0x prefix if it's not already in hexadecimal format
            const formattedQuestionId = questionId.startsWith("0x") ? questionId : `0x${questionId}`;

            // Call the contract method with formattedQuestionId
            await platformContract.methods.postAnswer(formattedQuestionId).send({
                from: account
            });

            console.log("Answer posted successfully");
            // Optionally update the database or UI here
        } catch (error) {
            console.error("Error posting answer:", error);
        }
    };

    return (
        <div>
            <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer"
            />
            <button onClick={handlePostAnswer}>Post Answer</button>
        </div>
    );
};

export default PostAnswer;