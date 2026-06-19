import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const severities = [
  { value: 'low', label: 'Low', desc: 'Minor puddles, walkable', icon: '🟢' },
  { value: 'medium', label: 'Medium', desc: 'Road blocked, knee-deep', icon: '🟡' },
  { value: 'high', label: 'High', desc: 'Houses flooded, danger', icon: '🔴' },
]

export default function Complaint() {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [complaintId, setComplaintId] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', ward: '', location: '', severity: '', description: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    const id = 'WL-' + Date.now().toString().slice(-6)
    const complaints = JSON.parse(localStorage.getItem('complaints') || '[]')
    complaints.push({ ...form, id, status: 'pending', submittedAt: new Date().toISOString() })
    localStorage.setItem('complaints', JSON.stringify(complaints))
    setComplaintId(id)
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Complaint Registered</h2>
        <p className="text-slate-400 text-sm mb-6">Your report has been submitted. Expected action within 24–48 hours.</p>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-6 py-4 mb-6">
          <p className="text-xs text-slate-500 mb-1">Your Complaint ID</p>
          <p className="text-2xl font-mono font-bold text-emerald-400">{complaintId}</p>
          <p className="text-xs text-slate-500 mt-1">Save this for tracking</p>
        </div>
        <div className="text-sm text-slate-400 bg-slate-800/50 rounded-xl p-4 text-left mb-6 space-y-1.5">
          <div><span className="text-slate-500">Area: </span><span className="text-white">{form.ward}</span></div>
          <div><span className="text-slate-500">Severity: </span><span className="text-white capitalize">{form.severity}</span></div>
          <div><span className="text-slate-500">Location: </span><span className="text-white">{form.location}</span></div>
        </div>
        <button onClick={() => navigate('/')}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition">
          Back to Home
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-8 transition">
          ← Back to Home
        </button>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Report Waterlogging</h1>
          <p className="text-slate-400 text-sm">Help MCD respond faster by reporting incidents in your area.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Name *</label>
              <input required type="text" placeholder="Full name"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600 transition"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone Number *</label>
              <input required type="tel" placeholder="10-digit number"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600 transition"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Ward / Area *</label>
            <input required type="text" placeholder="e.g. Rohini, Karol Bagh, Laxmi Nagar"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600 transition"
              value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Exact Location *</label>
            <input required type="text" placeholder="Street name, landmark, colony"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600 transition"
              value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Severity *</label>
            <div className="grid grid-cols-3 gap-3">
              {severities.map(s => (
                <button key={s.value} type="button"
                  onClick={() => setForm({ ...form, severity: s.value })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.severity === s.value
                      ? s.value === 'high' ? 'border-red-500 bg-red-500/10'
                        : s.value === 'medium' ? 'border-amber-500 bg-amber-500/10'
                        : 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-sm font-medium text-white">{s.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description *</label>
            <textarea required rows={4} placeholder="Describe the situation — water level, affected people, road condition..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600 transition resize-none"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <button type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5">
            Submit Report →
          </button>
        </form>
        <p className="text-center text-xs text-slate-600 mt-4">
          No login required · Your details are kept private · MCD response within 24–48 hours
        </p>
      </div>
    </div>
  )
}