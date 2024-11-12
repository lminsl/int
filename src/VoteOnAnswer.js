import React, { useState, useEffect } from 'react';

const VoteOnAnswer = ({ platformContract, answerId, account, stakeAmount }) => {
    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        // Check if the user has already voted on this answer
        const checkIfVoted = async () => {
            try {
                const voted = await platformContract.methods.hasUserVoted(answerId, account).call();
                setHasVoted(voted);
            } catch (error) {
                console.error("Error checking vote status:", error);
            }
        };

        checkIfVoted();
    }, [answerId, account, platformContract]);

    const vote = async (isCorrect) => {
        try {
            await platformContract.methods.voteOnAnswer(answerId, isCorrect).send({ from: account, value: stakeAmount });
            setHasVoted(true); // Set hasVoted to true after voting
        } catch (error) {
            console.error("Error voting on answer:", error);
        }
    };

    return (
        <div>
            {hasVoted ? (
                <p>You've already voted on this answer.</p>
            ) : (
                <>
                    <button onClick={() => vote(true)}>Vote Correct</button>
                    <button onClick={() => vote(false)}>Vote Incorrect</button>
                </>
            )}
        </div>
    );
};

export default VoteOnAnswer;
