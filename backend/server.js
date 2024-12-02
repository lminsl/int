// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3500; // Uses port 3500

// Middleware
app.use(cors()); // Enable CORS for all requests
app.use(bodyParser.json()); // Parse JSON request bodies

// Connect to MongoDB 
mongoose.connect('mongodb://localhost:27017/questions', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define a Question schema
const questionSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Add title field
    question: { type: String, required: true },
    tokens: { type: Number, required: true },
    account: { type: String, required: true },
    timestamp: { type: Number, required: true }, // Store the timestamp as a number
});

module.exports = mongoose.model('Question', questionSchema);

// Create a model from the schema
const Question = mongoose.model('Question', questionSchema);

// API endpoint to post a question
app.post('/api/questions', async (req, res) => {
    try {
        const { title, question, account, tokens, timestamp} = req.body; // Destructure the request body

        // Create a new question instance
        const newQuestion = new Question({ title, question, account, tokens, timestamp});

        // Save the question to the database
        await newQuestion.save();

        // Send back the saved question as a response
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Error saving question:", error);
        res.status(500).json({ message: 'Error saving question', error });
    }
});

function gaussianRandom(mean = 0, stdev = 1) {
    // gives Gaussian distribution
    let u = 1 - Math.random(); // Avoids log(0) error
    let v = 1 - Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
}

async function getQuestionsWithPriority() {
    // if question has k tokens, the "selection index" has probability distribution
    // if t is the time passed after posting, 
    // = (tokens + {small Gaussian error}) * e^{-lambda * t}
    try {
        const results = await Question.aggregate([
            {
                $addFields: {
                    randomScore: { $multiply: ["$tokens", Math.random()] }  // random weight based on tokens
                }
            },
            { $sort: { randomScore: -1 } }  // Sort by randomScore in descending order
        ]);
        
        return results;
    } catch (error) {
        console.error(error);
        throw error;
    }
}



// API endpoint to fetch all questions
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: 'Error fetching questions', error });
    }
});

// API endpoint to fetch all questions
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: 'Error fetching questions', error });
    }
});

// Define an Answer schema
const answerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    answer: { type: String, required: true },
    expert: { type: String, required: true },
    rewardEscrow: { type: Number, required: true },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    finalized: { type: Boolean, default: false }
});

const Answer = mongoose.model('Answer', answerSchema);

// API endpoint to post an answer
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

// API endpoint to fetch answers for a question
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