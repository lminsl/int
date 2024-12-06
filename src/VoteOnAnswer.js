/* global BigInt */
import React, { useState, useEffect } from 'react';
import './App.css';

const VoteOnAnswer = ({ platformContract, questionId, account, 
    stakeAmount, validatorStatus }) => {
    const [hasVoted, setHasVoted] = useState(false);
    const [isVotingAllowed, setIsVotingAllowed] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Check if the user has already voted and if the voting window is still active
        const checkVotingStatus = async () => {
            try {
                if (!platformContract || !questionId) {
                    setErrorMessage("Platform contract or answer ID is missing.");
                    return;
                }

                // Ensure answerId is converted to uint256
                const formattedQuestionId = BigInt(`0x${questionId}`).toString();
                console.log(formattedQuestionId)

                const voted = await platformContract.methods.hasVoted(formattedQuestionId, account).call();
                setHasVoted(voted);
                console.log(voted)

                const answer = await platformContract.methods.answers(formattedQuestionId).call();
                const votingWindow = await platformContract.methods.votingWindow().call();

                const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
                const votingEndTime = parseInt(answer.timestamp) + parseInt(votingWindow);
                console.log('Answer Data:', answer);
                
                console.log('Answer time:', answer.timestamp);
                console.log('Answer window:', votingWindow);
                console.log('current:', currentTime);

                

                setIsVotingAllowed(currentTime <= votingEndTime);
            } catch (error) {
                console.error("Error checking voting status:", error);
                setErrorMessage("Error checking voting status. Please try again.");
            }
        };

        checkVotingStatus();
    }, [questionId, account, platformContract]);

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
            const formattedQuestionId = BigInt(`0x${questionId}`).toString();

            await platformContract.methods.voteOnAnswer(formattedQuestionId, isCorrect).send({ from: account });
            setHasVoted(true); // Mark the user as having voted
            setErrorMessage("Vote submitted successfully!");
        } catch (error) {
            console.error("Error voting on answer:", error);
            setErrorMessage("Error occurred during voting. Please try again.");
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Vote on Answer</h2>
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {hasVoted ? (
                <p>You have already voted on this answer.</p>
            ) : isVotingAllowed ? (
                validatorStatus ? (
                    <div style={{display: 'flex', width: '40%', justifyContent: 'space-between'}}>
                        <button class="button" onClick={() => vote(true)}>Vote Correct</button>
                        <button class="button" onClick={() => vote(false)}>Vote Incorrect</button>
                    </div>
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