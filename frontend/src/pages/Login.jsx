import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const VALID_USERS = {
  'ADMIN001': { password: 'admin@123', department: 'mcd-admin', accessLevel: 'admin', name: 'Rajesh Kumar' },
  'ADMIN002': { password: 'admin@456', department: 'mcd-admin', accessLevel: 'admin', name: 'Priya Singh' },
  'DRAIN001': { password: 'drain@123', department: 'drainage', accessLevel: 'supervisor', name: 'Suresh Yadav' },
  'DRAIN002': { password: 'drain@456', department: 'drainage', accessLevel: 'field-officer', name: 'Amit Sharma' },
  'DRAIN003': { password: 'drain@789', department: 'drainage', accessLevel: 'analyst', name: 'Neha Gupta' },
  'EMER001':  { password: 'emergency@123', department: 'emergency', accessLevel: 'supervisor', name: 'Vikram Rathore' },
  'WARD001':  { password: 'ward@123', department: 'ward-officer', accessLevel: 'supervisor', name: 'Pooja Mehta' },
  'DATA001':  { password: 'data@123', department: 'data-analytics', accessLevel: 'analyst', name: 'Arjun Nair' },
}

const demoHints = [
  { id: 'ADMIN001', pass: 'admin@123', dept: 'mcd-admin', level: 'admin', label: 'Admin' },
  { id: 'DRAIN001', pass: 'drain@123', dept: 'drainage', level: 'supervisor', label: 'Supervisor' },
  { id: 'DATA001',  pass: 'data@123',  dept: 'data-analytics', level: 'analyst', label: 'Analyst' },
]

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ employeeId: '', password: '', department: '', accessLevel: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const fillDemo = (d) => setForm({ employeeId: d.id, password: d.pass, department: d.dept, accessLevel: d.level })

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const user = VALID_USERS[form.employeeId]
      if (!user) { setError('Employee ID not found in the system.'); setLoading(false); return }
      if (user.password !== form.password) { setError('Incorrect password.'); setLoading(false); return }
      if (user.department !== form.department) { setError(`This ID belongs to the ${user.department} department.`); setLoading(false); return }
      if (user.accessLevel !== form.accessLevel) { setError(`Your assigned access level is "${user.accessLevel}".`); setLoading(false); return }
      localStorage.setItem('user', JSON.stringify({ name: user.name, role: user.accessLevel, employeeId: form.employeeId }))
      navigate('/dashboard')
    }, 900)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-950 to-slate-900 p-12 border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-lg">🌊</div>
            <span className="font-bold text-white">Delhi Waterlogging System</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Protecting Delhi,<br />one ward at a time.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Monitor 289 wards, predict flood risk with 92.5% accuracy, and coordinate emergency response — all from one dashboard.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { num: '289', label: 'Wards Monitored' },
            { num: '48', label: 'High Risk Zones' },
            { num: '92.5%', label: 'ML Accuracy' },
            { num: '24h', label: 'Response Target' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="text-2xl font-bold text-blue-400">{s.num}</div>
              <div className="text-sm text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-8 transition">
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold text-white mb-1">Authority Login</h1>
          <p className="text-slate-400 text-sm mb-8">Sign in with your MCD employee credentials</p>

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-xl mb-6 flex items-start gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Employee ID</label>
              <input type="text" required placeholder="e.g. ADMIN001"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600 transition"
                value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required placeholder="Enter your password"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600 transition"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition text-sm">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Department</label>
              <select required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                <option value="">Select your department</option>
                <option value="mcd-admin">MCD Administration</option>
                <option value="drainage">Drainage & Sewerage</option>
                <option value="emergency">Emergency Response & Disaster Mgmt</option>
                <option value="urban-planning">Urban Planning & Development</option>
                <option value="public-works">Public Works Department (PWD)</option>
                <option value="ward-officer">Ward Officer</option>
                <option value="data-analytics">Data Analytics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Access Level</label>
              <select required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={form.accessLevel} onChange={e => setForm({ ...form, accessLevel: e.target.value })}>
                <option value="">Select access level</option>
                <option value="admin">Administrator — Full Access</option>
                <option value="supervisor">Supervisor — Ward Level</option>
                <option value="analyst">Data Analyst — View & Reports</option>
                <option value="field-officer">Field Officer</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 mt-2">
              {loading ? '⏳ Verifying...' : 'Sign in to Dashboard →'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Quick Demo Login</p>
            <div className="flex gap-2 flex-wrap">
              {demoHints.map((d, i) => (
                <button key={i} onClick={() => fillDemo(d)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition">
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-2">Click a role to auto-fill credentials</p>
          </div>
        </div>
      </div>
    </div>
  )
}