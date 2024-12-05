/* global BigInt */
import React, { useState, useEffect } from 'react';

const VoteOnAnswer = ({ platformContract, answerId, account, stakeAmount, validatorStatus }) => {
    const [hasVoted, setHasVoted] = useState(false);
    const [isVotingAllowed, setIsVotingAllowed] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Check if the user has already voted and if the voting window is still active
        const checkVotingStatus = async () => {
            try {
                if (!platformContract || !answerId) {
                    setErrorMessage("Platform contract or answer ID is missing.");
                    return;
                }

                // Ensure answerId is converted to uint256
                const formattedAnswerId = BigInt(`0x${answerId}`).toString();

                const voted = await platformContract.methods.hasVoted(formattedAnswerId, account).call();
                setHasVoted(voted);

                const answer = await platformContract.methods.answers(formattedAnswerId).call();
                const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
                const votingEndTime = parseInt(answer.timestamp) + parseInt(answer.votingWindow);

                setIsVotingAllowed(currentTime <= votingEndTime);
            } catch (error) {
                console.error("Error checking voting status:", error);
                setErrorMessage("Error checking voting status. Please try again.");
            }
        };

        checkVotingStatus();
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

            // Ensure answerId is converted to uint256
            const formattedAnswerId = BigInt(`0x${answerId}`).toString();

            await platformContract.methods.voteOnAnswer(formattedAnswerId, isCorrect).send({ from: account });
            setHasVoted(true); // Mark the user as having voted
            setErrorMessage("Vote submitted successfully!");
        } catch (error) {
            console.error("Error voting on answer:", error);
            setErrorMessage("Error occurred during voting. Please try again.");
        }
    };

    return (
        <div>
            {errorMessage && <p className="error-message">{errorMessage}</p>}

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
        </div>
    );
};

export default VoteOnAnswer;