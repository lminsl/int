const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3500;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/questions', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define a Question schema
const questionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    question: { type: String, required: true },
    tokens: { type: Number, required: true },
    account: { type: String, required: true },
    timestamp: { type: Number, required: true },
});

const Question = mongoose.model('Question', questionSchema);

// Define an Answer schema
const answerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    answer: { type: String, required: true },
    expert: { type: String, required: true },
    rewardEscrow: { type: Number, required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    finalized: { type: Boolean, default: false },
});

const Answer = mongoose.model('Answer', answerSchema);

// API to post a question
app.post('/api/questions', async (req, res) => {
    try {
        const { title, question, account, tokens, timestamp } = req.body;
        const newQuestion = new Question({ title, question, account, tokens, timestamp });
        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Error saving question:", error);
        res.status(500).json({ message: 'Error saving question', error });
    }
});

// API to fetch all questions
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: 'Error fetching questions', error });
    }
});

// API to fetch a single question by ID
app.get('/api/questions/:id', async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }
        res.json(question);
    } catch (error) {
        console.error("Error fetching question:", error);
        res.status(500).json({ message: 'Error fetching question', error });
    }
});

// API to post an answer
app.post('/api/answers', async (req, res) => {
    try {
        const { questionId, answer, expert, rewardEscrow } = req.body;
        const newAnswer = new Answer({ questionId, answer, expert, rewardEscrow });
        await newAnswer.save();
        res.status(201).json(newAnswer);
    } catch (error) {
        console.error("Error saving answer:", error);
        res.status(500).json({ message: 'Error saving answer', error });
    }
});

// API to fetch answers for a question
app.get('/api/questions/:questionId/answers', async (req, res) => {
    try {
        const answers = await Answer.find({ questionId: req.params.questionId });
        res.json(answers);
    } catch (error) {
        console.error("Error fetching answers:", error);
        res.status(500).json({ message: 'Error fetching answers', error });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
