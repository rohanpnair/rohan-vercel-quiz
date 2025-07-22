

import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Container, Typography, Button, Box, TextField, List, ListItem, ListItemText, Paper, AppBar, Toolbar, IconButton, Snackbar, Alert, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import QuizIcon from '@mui/icons-material/Quiz';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const API_URL = '/api';


function App() {
  // All hooks must be at the top level, before any return
  const [view, setView] = useState('home'); // home | create | select | attempt
  const [quizzes, setQuizzes] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [newQ, setNewQ] = useState({ question: '', options: ['', '', '', ''], answer: '' });
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  // For quiz attempt
  const [attemptAnswers, setAttemptAnswers] = useState([]);
  const [attemptSubmitted, setAttemptSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Fetch quizzes from backend
  useEffect(() => {
    if (view === 'select' || view === 'home') {
      setLoading(true);
      fetch(`${API_URL}/quizzes`)
        .then(res => res.json())
        .then(data => setQuizzes(data))
        .catch(() => setSnack({ open: true, message: 'Failed to load quizzes', severity: 'error' }))
        .finally(() => setLoading(false));
    }
  }, [view]);

  // Reset attempt state when starting a new attempt (must be at top level)
  useEffect(() => {
    if (view === 'attempt' && selectedQuiz) {
      setAttemptAnswers(Array(selectedQuiz.questions.length).fill(''));
      setAttemptSubmitted(false);
      setAttemptResult(null);
    }
  }, [view, selectedQuiz]);

  // Home screen
  if (view === 'home') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <AppBar position="static">
          <Toolbar>
            <QuizIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Brainiacs Quiz App</Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 6 }}>
          <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={() => setView('create')}>Create a Quiz</Button>
          <Button variant="outlined" size="large" startIcon={<QuizIcon />} onClick={() => setView('select')}>Attempt a Quiz</Button>
        </Box>
        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
          <Alert severity={snack.severity}>{snack.message}</Alert>
        </Snackbar>
      </Container>
    );
  }

  // ...existing code...

  // ...existing code...

  // ...existing code...

  const handleAttemptOptionClick = (option, idx) => {
    if (attemptSubmitted) return;
    const newAnswers = [...attemptAnswers];
    newAnswers[idx] = option;
    setAttemptAnswers(newAnswers);
  };

  const handleAttemptSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/quizzes/${selectedQuiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: attemptAnswers })
      });
      if (!res.ok) throw new Error('Failed to submit');
      const data = await res.json();
      setAttemptResult(data);
      setAttemptSubmitted(true);
    } catch {
      setSnack({ open: true, message: 'Error submitting answers', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (view === 'attempt' && selectedQuiz) {
    const quizQuestions = selectedQuiz.questions;
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => setView('home')}><ArrowBackIcon /></IconButton>
          <Typography variant="h5" sx={{ ml: 1 }}>{selectedQuiz.title}</Typography>
        </Box>
        {quizQuestions.map((q, idx) => (
          <Paper key={idx} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1">Q{idx + 1}: {q.question}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {q.options.map((option, oidx) => (
                <Button
                  key={oidx}
                  variant={attemptAnswers[idx] === option ? 'contained' : 'outlined'}
                  onClick={() => handleAttemptOptionClick(option, idx)}
                  disabled={attemptSubmitted}
                >
                  {option}
                </Button>
              ))}
            </Box>
          </Paper>
        ))}
        {!attemptSubmitted ? (
          <Button variant="contained" onClick={handleAttemptSubmit} disabled={loading} sx={{ mt: 2 }}>Submit Answers</Button>
        ) : attemptResult && (
          <Alert severity="success" sx={{ mt: 2 }}>Your Score: {attemptResult.score} / {attemptResult.total}</Alert>
        )}
        {loading && <CircularProgress sx={{ mt: 2 }} />}
        <Button variant="outlined" onClick={() => setView('home')} sx={{ mt: 2 }}>Home</Button>
        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
          <Alert severity={snack.severity}>{snack.message}</Alert>
        </Snackbar>
      </Container>
    );
  }

  return null;
}

export default App;



// (Removed duplicate App function. Only the Material UI-based App is exported below.)
