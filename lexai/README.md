# LexAI — Legal Document Assistant

> AI-powered legal document analysis built for Prompt Wars. Powered by Google Gemini.

## Features

- 📖 **Simplify** — Rewrite complex legal text in plain English
- 📋 **Summarize** — Get a concise, structured overview
- ⚠️ **Find Risks** — Identify red flags, one-sided clauses, and hidden risks
- ✅ **Checklist** — Generate actionable obligation checklists
- 💬 **Lawyer Prep** — Get smart questions to ask your attorney
- ⚖️ **Compare** — Side-by-side comparison of two documents
- 🔍 **Ask a Question** — Ask anything about your document

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Google Gemini API** (`gemini-3.8-flash`)

## Local Development

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_key_here
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### One-click deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual deploy:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. From the `lexai` directory:
   ```bash
   vercel
   ```
3. When prompted, add the environment variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey)

> ⚖️ **Disclaimer:** LexAI provides general legal information only. It does not constitute legal advice and is not a substitute for a qualified attorney.
