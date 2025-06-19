import React, { useState, useEffect } from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";

function generateQuizCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const API_BASE_URL = window.location.origin;

function App() {
    const [view, setView] = useState('home');
    const [quizCode, setQuizCode] = useState('');
    const [quizTitle, setQuizTitle] = useState('');
    const [quizQuestions, setQuizQuestions] = useState([{ question: '', options: ['', '', '', ''], correctAnswer: '' }]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);

    const addQuestion = () => {
        setQuizQuestions([...quizQuestions, { question: '', options: ['', '', '', ''], correctAnswer: '' }]);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...quizQuestions];
        // Create a new question object to ensure immutability
        newQuestions[index] = {
            ...newQuestions[index],
            [field]: value
        };
        setQuizQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...quizQuestions];
        const updatedQuestion = { ...newQuestions[qIndex] };
        const newOptions = [...updatedQuestion.options];
        newOptions[oIndex] = value;
        updatedQuestion.options = newOptions;
        newQuestions[qIndex] = updatedQuestion;
        setQuizQuestions(newQuestions);
    };

    // New handler for setting the correct answer, ensuring immutability
    const handleCorrectAnswerChange = (qIndex, selectedOption) => {
        const newQuestions = [...quizQuestions];
        const updatedQuestion = { ...newQuestions[qIndex] }; // Create new question object
        updatedQuestion.correctAnswer = selectedOption;      // Update property
        newQuestions[qIndex] = updatedQuestion;              // Assign new object
        setQuizQuestions(newQuestions);
    };

    const handleCreateQuiz = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/create-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: quizTitle, questions: quizQuestions }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Quiz created! Code: ${data.quizCode}`);
                setQuizCode(data.quizCode);
                setView('home');
                setQuizTitle('');
                setQuizQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: '' }]);
            } else {
                alert(`Error creating quiz: ${data.error} - ${data.details}`);
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Failed to connect to the server.');
        }
    };

    const handleJoinQuiz = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/get-quiz?code=${quizCode.toUpperCase()}`);
            const data = await response.json();
            if (response.ok) {
                setCurrentQuiz(data);
                setAnswers({});
                setScore(null);
                setView('quiz');
            } else {
                alert(`Error joining quiz: ${data.error} - ${data.details}`);
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Failed to connect to the server.');
        }
    };

    const handleAnswerChange = (questionIndex, selectedOption) => {
        setAnswers({
            ...answers,
            [questionIndex]: selectedOption,
        });
    };

    const handleSubmitQuiz = () => {
        let correctCount = 0;
        currentQuiz.questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                correctCount++;
            }
        });
        setScore(correctCount);
        setView('result');
    };

    const renderHome = () => (
        <div>
            <h1>Online Quiz App</h1>
            <button onClick={() => setView('create')}>Create New Quiz</button>
            <br /><br />
            <input
                type="text"
                placeholder="Enter Quiz Code"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value)}
            />
            <button onClick={handleJoinQuiz}>Join Quiz</button>
        </div>
    );

    const renderCreateQuiz = () => (
        <div>
            <h2>Create New Quiz</h2>
            <input
                type="text"
                placeholder="Quiz Title"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
            /><br /><br />
            {quizQuestions.map((q, qIndex) => (
                <div key={qIndex} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                    <input
                        type="text"
                        placeholder={`Question ${qIndex + 1}`}
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                    /><br />
                    {q.options.map((option, oIndex) => (
                        <React.Fragment key={`option-input-${qIndex}-${oIndex}`}>
                            <input
                                type="text"
                                placeholder={`Option ${oIndex + 1}`}
                                value={option}
                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            />
                            <br />
                        </React.Fragment>
                    ))}
                    {/* FIX: Wrap label and br in a Fragment */}
                    <React.Fragment>
                        <label>Correct Answer:</label><br />
                    </React.Fragment>
                    {q.options.map((option, oIndex) => (
                        <label key={`correct-radio-${qIndex}-${oIndex}`} style={{ marginRight: '10px' }}>
                            <input
                                type="radio"
                                name={`correct-answer-${qIndex}`}
                                value={option}
                                checked={q.correctAnswer === option}
                                // Use the new immutable handler
                                onChange={() => handleCorrectAnswerChange(qIndex, option)}
                            />
                            {option}
                        </label>
                    ))}

                </div>
            ))}
            <button onClick={addQuestion}>Add Question</button>
            <button onClick={handleCreateQuiz}>Save Quiz</button>
            <button onClick={() => setView('home')}>Back to Home</button>
        </div>
    );

    const renderQuiz = () => (
        <div>
            <h2>{currentQuiz?.title}</h2>
            {currentQuiz?.questions.map((q, qIndex) => (
                <div key={qIndex} style={{ marginBottom: '15px' }}>
                    <h3>{qIndex + 1}. {q.question}</h3>
                    {q.options.map((option, oIndex) => (
                        <label key={oIndex} style={{ display: 'block' }}>
                            <input
                                type="radio"
                                name={`question-${qIndex}`}
                                value={option}
                                checked={answers[qIndex] === option}
                                onChange={() => handleAnswerChange(qIndex, option)}
                            />
                            {option}
                        </label>
                    ))}
                </div>
            ))}
            <button onClick={handleSubmitQuiz}>Submit Quiz</button>
            <button onClick={() => setView('home')}>Back to Home</button>
        </div>
    );

    const renderResult = () => (
        <div>
            <h2>Quiz Results</h2>
            <p>You scored {score} out of {currentQuiz?.questions.length}!</p>
            <button onClick={() => setView('home')}>Play Again</button>
        </div>
    );

    switch (view) {
        case 'create':
            return renderCreateQuiz();
        case 'quiz':
            return renderQuiz();
        case 'result':
            return renderResult();
        case 'home':
        default:
            return renderHome();
    }
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);