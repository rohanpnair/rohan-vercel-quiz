// Vercel Serverless Function API for quizzes (no Express)

let quizzes = [];

module.exports = async (req, res) => {
  const { method, url } = req;

  // Helper to parse quiz ID from URL
  const quizIdMatch = url.match(/^\/api\/quizzes\/([^/]+)(\/submit)?$/);

  // Create a new quiz
  if (method === 'POST' && url === '/api/quizzes') {
    let body = req.body;
    // For Vercel, body may be a string
    if (typeof body === 'string') body = JSON.parse(body);
    const { title, questions } = body;
    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Invalid quiz data' });
    }
    const quiz = { id: Date.now().toString(), title, questions };
    quizzes.push(quiz);
    return res.status(201).json(quiz);
  }

  // Get all quizzes
  if (method === 'GET' && url === '/api/quizzes') {
    return res.json(quizzes.map(({ id, title }) => ({ id, title })));
  }

  // Get quiz by id
  if (method === 'GET' && quizIdMatch && !quizIdMatch[2]) {
    const quiz = quizzes.find(q => q.id === quizIdMatch[1]);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    return res.json(quiz);
  }

  // Submit answers (basic scoring)
  if (method === 'POST' && quizIdMatch && quizIdMatch[2] === '/submit') {
    const quiz = quizzes.find(q => q.id === quizIdMatch[1]);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { answers } = body;
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'Invalid answers' });
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] && answers[i] === q.answer) score++;
    });
    return res.json({ score, total: quiz.questions.length });
  }

  // Not found
  res.status(404).json({ error: 'Not found' });
};