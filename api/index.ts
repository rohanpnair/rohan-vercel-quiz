// api/index.ts

import type { Request, Response } from '@vercel/node';

import { createClient } from '@libsql/client';

function generateQuizCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

let dbClient: ReturnType<typeof createClient> | null = null;

async function getTursoDb() {
    if (!dbClient) {
        const dbUrl = process.env.DATABASE_URL;
        const authToken = process.env.DATABASE_AUTH_TOKEN;

        if (!dbUrl || !authToken) {
            console.error("Environment variables DATABASE_URL or DATABASE_AUTH_TOKEN are not set.");
            throw new Error("Database configuration missing. Please set DATABASE_URL and DATABASE_AUTH_TOKEN in Vercel project settings.");
        }

        dbClient = createClient({
            url: dbUrl,
            authToken: authToken,
        });

        try {
            await dbClient.execute(`
                CREATE TABLE IF NOT EXISTS quizzes_v2 (
                    quiz_code TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    questions TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log("Database table 'quizzes_v2' checked/created successfully.");
        } catch (error: any) {
            console.error("Error creating/checking database table:", error);
            throw new Error(`Database table initialization failed: ${error.message || error}`);
        }
    }
    return dbClient;
}

export default async function server(request: Request): Promise<Response> {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let dbInstance;
    try {
        dbInstance = await getTursoDb();
    } catch (dbError: any) {
        console.error("Database connection error:", dbError);
        return new Response(JSON.stringify({
            error: 'Database connection failed',
            details: String(dbError)
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }

    if (request.method === 'POST' && path === '/api/create-quiz') {
        try {
            const quizData = await request.json();

            if (!quizData.title || typeof quizData.title !== 'string' || !quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
                return new Response(JSON.stringify({
                    error: 'Invalid quiz data',
                    details: 'Quiz must have a string title and a non-empty array of questions.'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            for (const q of quizData.questions) {
                if (typeof q.question !== 'string' || !Array.isArray(q.options) || q.options.length !== 4 || q.options.some((opt: any) => typeof opt !== 'string') || typeof q.correctAnswer !== 'string') {
                    return new Response(JSON.stringify({
                        error: 'Invalid question format',
                        details: 'Each question must have a string "question", an array of 4 string "options", and a string "correctAnswer".'
                    }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders }
                    });
                }
            }

            const quizCode = generateQuizCode();
            console.log(`Attempting to create quiz: ${quizCode} - ${quizData.title}`);

            const insertResult = await dbInstance.execute(
                `INSERT INTO quizzes_v2 (quiz_code, title, questions) VALUES (?, ?, ?)`,
                [quizCode, quizData.title, JSON.stringify(quizData.questions)]
            );
            console.log("Insert operation result:", insertResult);

            return new Response(JSON.stringify({
                quizCode,
                message: 'Quiz created successfully'
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });

        } catch (quizCreationError: any) {
            console.error('Quiz creation error:', quizCreationError);
            return new Response(JSON.stringify({
                error: 'Failed to create quiz',
                details: String(quizCreationError)
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    if (request.method === 'GET' && path === '/api/get-quiz') {
        try {
            const quizCode = url.searchParams.get('code');

            if (!quizCode || typeof quizCode !== 'string' || quizCode.length !== 6) {
                return new Response(JSON.stringify({
                    error: 'Invalid quiz code',
                    details: 'Quiz code must be a 6-character string.'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            console.log(`Attempting to retrieve quiz: ${quizCode}`);

            const result = await dbInstance.execute(
                `SELECT quiz_code, title, questions FROM quizzes_v2 WHERE quiz_code = ?`,
                [quizCode.toUpperCase()]
            );

            const quiz = result.rows.length > 0 ? result.rows[0] as { title: string, questions: string } : null;

            if (!quiz) {
                return new Response(JSON.stringify({
                    error: 'Quiz not found',
                    details: `No quiz found with code: ${quizCode}`
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }

            return new Response(JSON.stringify({
                title: quiz.title,
                questions: JSON.parse(quiz.questions)
            }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });

        } catch (quizRetrievalError: any) {
            console.error('Quiz retrieval error:', quizRetrievalError);
            return new Response(JSON.stringify({
                error: 'Failed to retrieve quiz',
                details: String(quizRetrievalError)
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }
    }

    return new Response(JSON.stringify({ message: 'API Route Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
}