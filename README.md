# Delhi Waterlogging Risk Management System

A GIS-based flood risk prediction and management dashboard for all 289 wards of Delhi, built for Hack4Delhi 2026 by Team Rasmalai.

## Live Demo

https://delhi-waterlog.vercel.app

## Features

- Live GIS Risk Map — All 289 Delhi wards color-coded by flood risk (Red/Yellow/Green)
- Bayesian Ensemble ML Model — Risk = (Drainage x 0.4 + Flood x 0.3 + Rainfall x 0.3)
- Analytics Dashboard — Zone-wise trends, top risk wards, rainfall charts
- IMD Rainfall Monitoring — Real rainfall data from 25 IMD stations
- Citizen Complaint Portal — File, track, edit, resolve complaints
- Live CCTV Monitoring — Camera feeds at high-risk locations
- User Management — Role-based access control with permissions matrix
- Multi-role Auth — Admin, Supervisor, Analyst, Field Officer
- Emergency Alert System — Zone-wise emergency dispatch
- CSV Export — Download ward risk reports

## Tech Stack

| Frontend | Mapping | Charts | Styling |
|----------|---------|--------|---------|
| React + Vite | Leaflet.js | Recharts | Tailwind CSS |
| React Router | react-leaflet | — | CSS Variables |

## Demo Login

| Role | Employee ID | Password | Department |
|------|------------|----------|------------|
| Admin | ADMIN001 | admin@123 | MCD Administration |
| Supervisor | DRAIN001 | drain@123 | Drainage & Sewerage |
| Analyst | DATA001 | data@123 | Data Analytics |
| Field Officer | DRAIN002 | drain@456 | Drainage & Sewerage |

## Run Locally

git clone https://github.com/SukritiChauhan/delhi-waterlog.git
cd delhi-waterlog/frontend
npm install
npm run dev

Open http://localhost:5173

## Data Sources

- India Meteorological Department (IMD) — Rainfall data
- MCD Drainage Records — Drainage capacity and flood history
- Data.gov.in — Ward boundaries and infrastructure data

## ML Model

Bayesian Ensemble Risk Formula:

Risk Score (0-100) = (DrainageFactor x 0.4) + (FloodFactor x 0.3) + (RainfallFactor x 0.3)

- High Risk: Score >= 58
- Medium Risk: Score 32-58
- Low Risk: Score < 32
- Model Accuracy: 92.5%

## Team Rasmalai — Hack4Delhi 2026

Built for smarter, safer Delhi.
