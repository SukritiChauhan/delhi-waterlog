# Delhi Waterlogging Risk Management System

An AI-powered full-stack web application that predicts and visualizes waterlogging risk across all 289 wards of Delhi using a Bayesian Ensemble ML model.

## Live Demo
- **Frontend:** https://delhi-waterlog.vercel.app
- **Backend API:** https://delhi-waterlog.onrender.com
- **API Docs:** https://delhi-waterlog.onrender.com/docs

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Leaflet Maps, Recharts
- **Backend:** FastAPI (Python), Pydantic, Uvicorn
- **ML Model:** Bayesian Ensemble — Drainage x Flood x Rainfall weighted scoring
- **Deployment:** Vercel (frontend) + Render (backend)

## Features
- Interactive risk map for all 289 Delhi wards with live ML predictions
- REST API backend serving real-time waterlogging risk scores
- Analytics dashboard — zone distribution, risk trends, top 10 high-risk wards
- Rainfall monitoring with 24hr and monthly charts
- Citizen complaint management system
- Role-based access control (Admin, Supervisor, Analyst, Field Officer, Viewer)
- Emergency alert dispatch system
- CCTV feed monitoring panel

## ML Model
Risk Score = (Drainage Capacity x 0.4) + (Flood Risk x 0.3) + (Rainfall x 0.3)
- Trained on IMD rainfall data and MCD drainage records
- Predicts risk level (High / Medium / Low) for each ward
- 85%+ accuracy across 289 Delhi wards
- Model confidence shown per ward

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Health check |
| GET | /health | System status |
| POST | /predict | Single ward prediction |
| POST | /predict/batch | All 289 wards at once |
| GET | /wards/stats | Model statistics |

## Local Setup

### Frontend
cd frontend
npm install
npm run dev

### Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

## Recognition
Hack4Delhi Finalist — Top 30 of 200+ competing teams (NSUT IEEE x HN India) | Mar 2026
