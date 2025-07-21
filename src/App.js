
import React, { useState } from 'react';
import './App.css';

const quizQuestions = [
  {
    question: 'What is the capital of France?',
    options: ['Berlin', 'London', 'Paris', 'Madrid'],
    answer: 'Paris',
  },
  {
    question: 'Which language runs in a web browser?',
    options: ['Java', 'C', 'Python', 'JavaScript'],
    answer: 'JavaScript',
  },
  {
    question: 'What does CSS stand for?',
    options: [
      'Central Style Sheets',
      'Cascading Style Sheets',
      'Cascading Simple Sheets',
      'Cars SUVs Sailboats',
    ],
    answer: 'Cascading Style Sheets',
  },
  {
    question: 'What year was JavaScript launched?',
    options: ['1996', '1995', '1994', 'none of the above'],
    answer: '1995',
  },
];

function App() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleOptionClick = (option) => {
    if (option === quizQuestions[current].answer) {
      setScore(score + 1);
    }
    const next = current + 1;
    if (next < quizQuestions.length) {
      setCurrent(next);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setScore(0);
    setShowResult(false);
  };

  return (
    <div className="quiz-container">
      <h1>Quiz App</h1>
      {showResult ? (
        <div className="result-section">
          <h2>Your Score: {score} / {quizQuestions.length}</h2>
          <button onClick={handleRestart}>Restart Quiz</button>
        </div>
      ) : (
        <div className="question-section">
          <h2>Question {current + 1} of {quizQuestions.length}</h2>
          <p className="question-text">{quizQuestions[current].question}</p>
          <div className="options-section">
            {quizQuestions[current].options.map((option, idx) => (
              <button key={idx} onClick={() => handleOptionClick(option)} className="option-btn">
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
