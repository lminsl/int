import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import VoteOnAnswer from './VoteOnAnswer';
import PostAnswer from './PostAnswer';
import axios from 'axios';
import './App.css';

const QuestionPage = ({ platformContract, account, web3, validatorStatus}) => {
    const { id } = useParams(); // Get the question ID from the URL
    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch the question and answers
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch the question details
                const questionResponse = await axios.get(`http://localhost:3500/api/questions/${id}`);
                setQuestion(questionResponse.data);

                // Fetch answers for the question
                const answersResponse = await axios.get(`http://localhost:3500/api/questions/${id}/answers`);
                setAnswers(answersResponse.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Refresh the answers list after posting
    const refreshAnswers = async () => {
        try {
            const response = await axios.get(`http://localhost:3500/api/questions/${id}/answers`);
            setAnswers(response.data);
        } catch (error) {
            console.error("Error refreshing answers:", error);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            {question ? (
                <div>
                    <h1 class="question-title">{question.title}</h1>
                    <div class="question-box">{question.question}</div>
                    <p>Bounty: {question.tokens} TIGR</p>
                    <p>asked by {question.account}</p>
                </div>
            ) : (
                <p>Question not found.</p>
            )}

            <PostAnswer
                platformContract={platformContract}
                questionId={id}
                account={account}
                web3={web3}
                stakeAmount={question.tokens}
                onAnswerPosted={refreshAnswers} // Callback to refresh answers
            />

            <h2>Answers</h2>
            {answers.length > 0 ? (
                answers.map((answer) => (
                    <div key={answer._id}>
                        <p>{answer.answer}</p>
                        {/* <span>{answer.upvotes} upvotes, {answer.downvotes} downvotes</span> */}
                        <VoteOnAnswer
                            platformContract={platformContract}
                            questionId={answer.questionId}
                            account={account}
                            validatorStatus={validatorStatus}
                        />
                    </div>
                ))
            ) : (
                <p>No answers posted yet.</p>
            )}
        </div>
    );
};

export default QuestionPage;
