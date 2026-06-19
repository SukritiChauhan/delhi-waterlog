import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const stats = [
  { num: '289', label: 'Wards Monitored', icon: '🗺️' },
  { num: '48', label: 'High Risk Zones', icon: '🔴' },
  { num: '92.5%', label: 'Model Accuracy', icon: '🤖' },
  { num: '2,247', label: 'Complaints Logged', icon: '📋' },
]

const features = [
  { icon: '🗺️', title: 'Ward-Level GIS Mapping', desc: 'Interactive maps showing all 289 Delhi wards color-coded by flood risk in real time.' },
  { icon: '🤖', title: 'Bayesian Ensemble ML', desc: 'Risk scores computed using drainage capacity, flood history, and IMD rainfall data.' },
  { icon: '⚠️', title: 'Red / Yellow / Green Zones', desc: 'Clear risk tiers help authorities prioritize resources before incidents escalate.' },
  { icon: '📡', title: 'IMD Weather Integration', desc: 'Live rainfall data from India Meteorological Department feeds the prediction model.' },
  { icon: '📝', title: 'Citizen Complaint Portal', desc: 'Residents report waterlogging directly. Complaints flow into the authority dashboard.' },
  { icon: '📊', title: 'Analytics & PDF Reports', desc: 'Zone-wise breakdown, top risk wards, drainage scores — exportable for planning.' },
]

const alerts = [
  '⚠️ High Risk: Ward 32 Kanjhawala — drainage overwhelmed',
  '🌧️ IMD: Heavy rainfall expected North Delhi next 24h',
  '✅ 85% complaints resolved this week',
  '🚨 Waterlogging reported: Minto Bridge underpass',
  '🤖 Bayesian Model active — 92.5% confidence',
]

export default function Landing() {
  const navigate = useNavigate()
  const [alertIdx, setAlertIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setAlertIdx(i => (i + 1) % alerts.length), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-red-600 py-2 px-4 text-center text-sm font-medium tracking-wide transition-all">
        {alerts[alertIdx]}
      </div>

      <header className="border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 bg-slate-950/95 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-lg">🌊</div>
          <div>
            <div className="font-bold text-sm leading-tight">Delhi Waterlogging System</div>
            <div className="text-xs text-slate-400">Municipal Corporation of Delhi</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {['About', 'Features', 'Statistics'].map(item => (
            <button key={item}
              onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition">
              {item}
            </button>
          ))}
        </nav>
        <div className="flex gap-2">
          <button onClick={() => navigate('/login')}
            className="text-sm px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white transition">
            Authority Login
          </button>
          <button onClick={() => navigate('/complaint')}
            className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium transition">
            File Complaint
          </button>
        </div>
      </header>

      <section className="relative px-6 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            Hack4Delhi 2026 — Team Rasmalai
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-5 tracking-tight">
            Delhi's Flood Risk,<br />
            <span className="text-blue-400">Predicted. Mapped. Acted On.</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            AI-powered waterlogging risk management across all 289 Delhi wards — powered by Bayesian Ensemble ML, IMD rainfall data, and real-time citizen reporting.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/login')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20">
              🔐 Authority Dashboard
            </button>
            <button onClick={() => navigate('/complaint')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-semibold transition-all hover:-translate-y-0.5">
              📝 Report Waterlogging
            </button>
          </div>
        </div>
      </section>

      <section id="statistics" className="px-6 py-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center hover:border-slate-600 transition">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-3xl font-bold text-white mb-1">{s.num}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="px-6 py-12 max-w-5xl mx-auto">
        <div id="about" className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Built for Proactive Governance</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Shifting Delhi's flood response from reactive to predictive — before the monsoon arrives.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 hover:-translate-y-1 transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-12 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10">Choose Your Portal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/40 transition">
            <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-8 text-center">
              <div className="text-5xl mb-3">👨‍💼</div>
              <h3 className="text-xl font-bold">Authority Dashboard</h3>
              <p className="text-blue-200 text-sm mt-1">MCD Officials & Emergency Teams</p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6">
                {['Live GIS risk map — all 289 wards','Bayesian ML predictions per ward','Complaint management + resolve','Zone-wise analytics & charts','PDF export for planning'].map((item, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/login')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition">
                Login to Dashboard →
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition">
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-700 p-8 text-center">
              <div className="text-5xl mb-3">👥</div>
              <h3 className="text-xl font-bold">Citizen Portal</h3>
              <p className="text-emerald-200 text-sm mt-1">Delhi Residents & Citizens</p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 mb-6">
                {['Report waterlogging in your area','Add location & severity details','Get a complaint tracking ID','No login required','Complaints reach MCD directly'].map((item, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">✓</span> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/complaint')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold transition">
                File a Complaint →
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-slate-500 text-sm">
        <div className="flex justify-center gap-6 mb-4 flex-wrap">
          {['Privacy Policy','Terms of Service','Contact Us','Data Sources'].map(l => (
            <a key={l} href="#" className="hover:text-slate-300 transition">{l}</a>
          ))}
        </div>
        <p>© 2026 Municipal Corporation of Delhi · Data: IMD, Data.gov.in, MCD Records</p>
        <p className="mt-1 text-slate-600">Built by Team Rasmalai · Hack4Delhi 2026</p>
      </footer>
    </div>
  )
}
