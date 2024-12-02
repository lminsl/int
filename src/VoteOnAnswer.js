import React, { useState, useEffect } from 'react';

const VoteOnAnswer = ({ platformContract, answerId, account, stakeAmount, validatorStatus }) => {
    const [hasVoted, setHasVoted] = useState(false);
    const [isVotingAllowed, setIsVotingAllowed] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Check if the user has already voted on this answer
        const checkIfVoted = async () => {
            try {
                const voted = await platformContract.methods.hasVoted(answerId, account).call();
                setHasVoted(voted);
            } catch (error) {
                console.error("Error checking vote status:", error);
            }
        };

        // Check if voting is still within the allowed window
        const checkVotingWindow = async () => {
            try {
                const answer = await platformContract.methods.answers(answerId).call();
                const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
                const votingEndTime = parseInt(answer.timestamp) + parseInt(answer.votingWindow);

                setIsVotingAllowed(currentTime <= votingEndTime);
            } catch (error) {
                console.error("Error checking voting window:", error);
            }
        };

        checkIfVoted();
        checkVotingWindow();
    }, [answerId, account, platformContract]);

    const vote = async (isCorrect) => {
        try {
            if (!validatorStatus) {
                setErrorMessage("Only validators can vote.");
                return;
            }
            if (hasVoted) {
                setErrorMessage("You have already voted.");
                return;
            }
            if (!isVotingAllowed) {
                setErrorMessage("Voting period has ended.");
                return;
            }

            await platformContract.methods.voteOnAnswer(answerId, isCorrect).send({ from: account, value: stakeAmount });
            setHasVoted(true); // Set hasVoted to true after voting
        } catch (error) {
            console.error("Error voting on answer:", error);
            setErrorMessage("Error occurred during voting. Please try again.");
        }
    };

    return (
        <div>
            {hasVoted ? (
                <p>You've already voted on this answer.</p>
            ) : isVotingAllowed ? (
                validatorStatus ? (
                    <>
                        <button onClick={() => vote(true)}>Vote Correct</button>
                        <button onClick={() => vote(false)}>Vote Incorrect</button>
                    </>
                ) : (
                    <p>Only validators can vote.</p>
                )
            ) : (
                <p>Voting period has ended.</p>
            )}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
    );
};

export default VoteOnAnswer;