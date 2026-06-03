# MedWay — Medical Search Engine

A Google-style medical search engine with AI-powered overviews, trusted source links, and an AI chat agent.

## Features

- **AI Overview** — Auto-generated medical summaries for every search
- **Trusted Sources** — Results from WHO, Mayo Clinic, NIH, PubMed, CDC, MedlinePlus, WebMD, NHS
- **Related Questions** — People Also Ask section with follow-up queries
- **MedAI Chat** — "Dive Deeper" AI agent for in-depth medical conversations
- **Real-time Suggestions** — Autocomplete as you type

## Quick Start (Local)

### 1. Install dependencies

```bash
cd artifacts/medway
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your **free** Groq API key:
- Get one at: https://console.groq.com (free, no credit card required)
- Without a key, the app still works — AI Overview uses Wikipedia summaries instead

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Optional (recommended) | Powers AI Overview and MedAI chat. Free at console.groq.com |
| `PORT` | Optional | Port to run on (default: 3000) |

## Tech Stack

- **Next.js 15** — React framework with App Router
- **TypeScript** — Type safety throughout
- **Tailwind CSS v4** — Styling
- **Groq SDK** — AI (llama-3.3-70b-versatile, free tier)
- **Wikipedia REST API** — Free medical content (no key needed)
- **PubMed E-utilities** — Free medical research articles (no key needed)

## Data Sources

- Wikipedia Medical Articles (free API)
- PubMed / NCBI (free API)
- Direct links to: WHO, Mayo Clinic, CDC, MedlinePlus, WebMD, NHS, Healthline

## Disclaimer

MedWay is for **educational purposes only**. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.
