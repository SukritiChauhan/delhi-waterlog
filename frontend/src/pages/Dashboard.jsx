import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { generateAllWards } from '../data/wardData'
import { fetchAllWardPredictions } from '../api/waterlogging'
import 'leaflet/dist/leaflet.css'

const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }

const ALERTS = [
  { icon: '⚠️', text: 'High Risk Alert: Ward 32 (Kanjhawala) - Drainage system overwhelmed' },
  { icon: '📊', text: 'Live Update: 247 complaints received today' },
  { icon: '🌧️', text: 'IMD Warning: Heavy rainfall expected in North Delhi next 24 hours' },
  { icon: '✅', text: 'Action Taken: 85% complaints resolved this week' },
  { icon: '🚨', text: 'Emergency: Water-logging reported in Minto Bridge area' },
  { icon: '🤖', text: 'ML Model Active: Bayesian Ensemble predictions updated — Confidence: 92.5%' },
  { icon: '📡', text: 'IMD Data Feed: Live connection active — 25 stations reporting' },
  { icon: '🔴', text: 'Priority Alert: 3 wards in Central Delhi require immediate intervention' },
]

const ROLE_ACCESS = {
  admin: ['risk-map','analytics','rainfall','complaints','cctv','user-management','settings','profile','dev-tools'],
  supervisor: ['risk-map','analytics','rainfall','complaints','cctv','settings','profile'],
  analyst: ['risk-map','analytics','rainfall','profile','settings'],
  'field-officer': ['risk-map','complaints','profile'],
  viewer: ['risk-map','profile'],
}

const ALL_USERS = [
  { id:'ADMIN001', name:'Rajesh Kumar', role:'admin', dept:'MCD Administration', status:'active', lastLogin:'2026-06-19 09:30', email:'rajesh.kumar@mcd.gov.in' },
  { id:'ADMIN002', name:'Priya Singh', role:'admin', dept:'MCD Administration', status:'active', lastLogin:'2026-06-18 14:20', email:'priya.singh@mcd.gov.in' },
  { id:'DRAIN001', name:'Suresh Yadav', role:'supervisor', dept:'Drainage & Sewerage', status:'active', lastLogin:'2026-06-19 08:00', email:'suresh.yadav@mcd.gov.in' },
  { id:'DRAIN002', name:'Amit Sharma', role:'field-officer', dept:'Drainage & Sewerage', status:'active', lastLogin:'2026-06-17 11:45', email:'amit.sharma@mcd.gov.in' },
  { id:'DRAIN003', name:'Neha Gupta', role:'analyst', dept:'Drainage & Sewerage', status:'active', lastLogin:'2026-06-19 10:15', email:'neha.gupta@mcd.gov.in' },
  { id:'EMER001', name:'Vikram Rathore', role:'supervisor', dept:'Emergency Response', status:'active', lastLogin:'2026-06-19 07:30', email:'vikram.rathore@mcd.gov.in' },
  { id:'WARD001', name:'Pooja Mehta', role:'supervisor', dept:'Ward Officer', status:'active', lastLogin:'2026-06-18 16:00', email:'pooja.mehta@mcd.gov.in' },
  { id:'DATA001', name:'Arjun Nair', role:'analyst', dept:'Data Analytics', status:'active', lastLogin:'2026-06-19 09:00', email:'arjun.nair@mcd.gov.in' },
]

const CCTV_FEEDS = [
  { id:1, location:'Minto Bridge Underpass', ward:'Ward 81', status:'live', risk:'high', waterLevel:'45 cm' },
  { id:2, location:'Kanjhawala Drain', ward:'Ward 32', status:'live', risk:'high', waterLevel:'62 cm' },
  { id:3, location:'Rohini Sector 15', ward:'Ward 21', status:'live', risk:'medium', waterLevel:'18 cm' },
  { id:4, location:'Laxmi Nagar Crossing', ward:'Ward 222', status:'live', risk:'medium', waterLevel:'22 cm' },
  { id:5, location:'Najafgarh Road', ward:'Ward 138', status:'offline', risk:'low', waterLevel:'N/A' },
  { id:6, location:'ITO Flyover', ward:'Ward 81', status:'live', risk:'low', waterLevel:'5 cm' },
]

function createWardIcon(ward) {
  const color = RISK_COLORS[ward.riskLevel]
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:26px;height:26px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:9px;">${ward.wardNo}</div>`,
    iconSize: [26,26], iconAnchor: [13,13],
  })
}

function generatePopupHTML(ward) {
  const color = RISK_COLORS[ward.riskLevel]
  const riskIcon = ward.riskLevel==='high'?'🔴':ward.riskLevel==='medium'?'🟡':'🟢'
  const mlConfidence = ward.mlConfidence
  const rainfallImpact = Math.round((ward.avgRainfall/1500)*100)
  const drainageCapacity = Math.round(ward.drainageScore*10)
  const riskCategory = ward.riskLevel==='high'?'CRITICAL':ward.riskLevel==='medium'?'ELEVATED':'NORMAL'
  const population = Math.floor(Math.random()*50000)+30000
  let recommendations = ''
  if(ward.riskLevel==='high') recommendations='🚨 Immediate drainage intervention required<br>📞 Deploy emergency response team<br>⚠️ Issue public safety alerts'
  else if(ward.riskLevel==='medium') recommendations='🛠️ Schedule preventive maintenance<br>📊 Monitor rainfall patterns closely<br>👷 Deploy standby drainage crew'
  else recommendations='✅ Regular monitoring sufficient<br>📈 Review quarterly drainage status<br>🌧️ Prepare for monsoon season'
  return `<div style="font-family:Arial,sans-serif;min-width:300px;max-width:340px;">
    <h3 style="margin:0 0 8px;color:#1e293b;font-size:1em;border-bottom:2px solid ${color};padding-bottom:5px;">🏙️ ${ward.wardName}</h3>
    <div style="background:${color}20;padding:10px;border-radius:6px;margin-bottom:10px;border-left:4px solid ${color};">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span>${riskIcon}</span><strong style="color:${color};font-size:0.85em;">BAYESIAN ENSEMBLE: ${riskCategory} RISK</strong></div>
      <div style="font-size:0.8em;color:#475569;line-height:1.6;">
        <div>📊 ML Risk Score: <strong>${ward.riskScore.toFixed(1)}/100</strong></div>
        <div>🤖 Model Confidence: <strong>${mlConfidence}%</strong></div>
        <div>📍 Ward Number: <strong>${ward.wardNo}</strong></div>
        <div>📅 Prediction: <strong>${new Date().toLocaleDateString('en-IN')}</strong></div>
      </div>
    </div>
    <table style="width:100%;font-size:0.8em;border-collapse:collapse;margin-bottom:10px;">
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:5px 0;color:#64748b;">🌧️ Annual Rainfall</td><td style="padding:5px 0;font-weight:600;text-align:right;">${ward.avgRainfall} mm</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:5px 0;color:#64748b;">💧 Drainage Score</td><td style="padding:5px 0;font-weight:600;text-align:right;">${ward.drainageScore}/10</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:5px 0;color:#64748b;">👥 Population</td><td style="padding:5px 0;font-weight:600;text-align:right;">${population.toLocaleString()}</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:5px 0;color:#64748b;">📍 Zone</td><td style="padding:5px 0;font-weight:600;text-align:right;text-transform:capitalize;">${ward.zone} Delhi</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:5px 0;color:#64748b;">📈 Incidents</td><td style="padding:5px 0;font-weight:600;text-align:right;">${ward.historicalIncidents}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b;">🔄 Updated</td><td style="padding:5px 0;font-weight:600;text-align:right;">${new Date().toLocaleDateString('en-IN')}</td></tr>
    </table>
    <div style="margin-bottom:10px;padding:10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <strong style="font-size:0.8em;color:#1e293b;display:block;margin-bottom:5px;">📊 ML Risk Factor Analysis:</strong>
      <div style="font-size:0.78em;color:#475569;line-height:1.6;">
        <div style="display:flex;justify-content:space-between;"><span>Rainfall Impact:</span><span><strong>${rainfallImpact}%</strong> (${ward.avgRainfall}mm/yr)</span></div>
        <div style="display:flex;justify-content:space-between;"><span>Drainage Capacity:</span><span><strong>${drainageCapacity}%</strong> (${ward.drainageScore}/10)</span></div>
        <div style="display:flex;justify-content:space-between;"><span>Infrastructure Age:</span><span><strong>${ward.systemAge} yrs</strong></span></div>
        <div style="display:flex;justify-content:space-between;"><span>Sewage Coverage:</span><span><strong>${ward.sewageCoverage}%</strong></span></div>
      </div>
    </div>
    <div style="padding:10px;background:linear-gradient(135deg,${color}15,${color}05);border-radius:6px;border-left:4px solid ${color};margin-bottom:8px;">
      <strong style="font-size:0.8em;color:#1e293b;display:block;margin-bottom:4px;">🚨 ML Recommendations:</strong>
      <div style="font-size:0.78em;color:#475569;line-height:1.6;">${recommendations}</div>
    </div>
    <div style="padding:7px;background:#1e3a8a;color:white;border-radius:4px;text-align:center;font-size:0.72em;">🤖 Bayesian Ensemble ML Model | Accuracy: 92.5%</div>
  </div>`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))
  const role = user?.role || 'viewer'
  const canAccess = (page) => ROLE_ACCESS[role]?.includes(page)

  const [wards, setWards] = useState([])
  const [filtered, setFiltered] = useState([])
  const [activePage, setActivePage] = useState('risk-map')
  const [riskFilter, setRiskFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [complaints, setComplaints] = useState([])
  const [showAlert, setShowAlert] = useState(true)
  const [alertIdx, setAlertIdx] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedWard, setSelectedWard] = useState(null)
  const [trendPeriod, setTrendPeriod] = useState(30)
  const [userSearch, setUserSearch] = useState('')
  const [devOutput, setDevOutput] = useState('')
  const [editingComplaint, setEditingComplaint] = useState(null)
  const [viewingComplaint, setViewingComplaint] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showHotspotModal, setShowHotspotModal] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [hotspotForm, setHotspotForm] = useState({ ward:'', location:'', severity:'high', reason:'' })
  const [emergencyForm, setEmergencyForm] = useState({ zone:'all', message:'', alertType:'flood' })
  const [hotspots, setHotspots] = useState(JSON.parse(localStorage.getItem('hotspots') || '[]'))

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    
    const localWards = generateAllWards()
    setWards(localWards)
    setFiltered(localWards)
    
    // Fetch from live API and update
    fetchAllWardPredictions(localWards).then(apiWards => {
      if (apiWards && apiWards.length > 0) {
        setWards(apiWards)
        setFiltered(apiWards)
        console.log('✅ Live API data loaded:', apiWards.length, 'wards')
      } else {
        console.log('⚠️ Using local fallback data')
      }
    })

    setComplaints(JSON.parse(localStorage.getItem('complaints') || '[]'))
    const t = setInterval(() => setAlertIdx(i => (i+1) % ALERTS.length), 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let result = wards
    if (riskFilter !== 'all') result = result.filter(w => w.riskLevel === riskFilter)
    if (search) result = result.filter(w => w.wardName.toLowerCase().includes(search.toLowerCase()) || w.wardNo.toString().includes(search))
    setFiltered(result)
  }, [riskFilter, search, wards])

  const saveComplaints = (updated) => {
    setComplaints(updated)
    localStorage.setItem('complaints', JSON.stringify(updated))
  }

  const resolveComplaint = (idx) => {
    const updated = [...complaints]
    updated[idx].status = 'resolved'
    saveComplaints(updated)
  }

  const deleteComplaint = (idx) => {
    if (!window.confirm('Delete this complaint? This cannot be undone.')) return
    saveComplaints(complaints.filter((_, i) => i !== idx))
  }

  const startEdit = (complaint, idx) => {
    setEditForm({ ...complaint, idx })
    setEditingComplaint(idx)
  }

  const saveEdit = () => {
    const updated = [...complaints]
    updated[editForm.idx] = { ...editForm }
    saveComplaints(updated)
    setEditingComplaint(null)
    setEditForm({})
  }

  const stats = {
    total: wards.length,
    high: wards.filter(w => w.riskLevel === 'high').length,
    medium: wards.filter(w => w.riskLevel === 'medium').length,
    low: wards.filter(w => w.riskLevel === 'low').length,
    avgRisk: wards.length ? (wards.reduce((s,w) => s+w.riskScore,0)/wards.length).toFixed(1) : 0,
  }

  const pendingCount = complaints.filter(c => c.status==='pending').length
  const resolvedCount = complaints.filter(c => c.status==='resolved').length

  const riskTrendData = Array.from({length:14},(_,i) => ({
    day:`D${i+1}`,
    high: Math.floor(Math.random()*20)+40,
    medium: Math.floor(Math.random()*30)+50,
    low: Math.floor(Math.random()*40)+150,
  }))

  const zoneData = ['north','south','east','west','central'].map(z => ({
    zone: z.charAt(0).toUpperCase()+z.slice(1),
    count: wards.filter(w => w.zone===z).length,
    high: wards.filter(w => w.zone===z && w.riskLevel==='high').length,
  }))

  const rainfallData24h = Array.from({length:24},(_,i) => ({
    hour:`${i}:00`, rainfall: Math.random()*15+(i>12&&i<18?20:2),
  }))

  const monthlyRainfall = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => ({
    month:m, rainfall:[19,20,15,8,30,65,211,195,120,15,8,12][i],
  }))

  const debugML = () => {
    const high = wards.filter(w=>w.riskLevel==='high').length
    const avg = (wards.reduce((s,w)=>s+w.riskScore,0)/wards.length).toFixed(2)
    const zones = {}; wards.forEach(w=>{zones[w.zone]=(zones[w.zone]||0)+1})
    setDevOutput(`✅ ML Debug\nTotal: ${wards.length}\nHigh: ${high} (${((high/wards.length)*100).toFixed(1)}%)\nMedium: ${stats.medium}\nLow: ${stats.low}\nAvg Score: ${avg}/100\nZones: ${JSON.stringify(zones)}`)
  }

  const logout = () => { localStorage.removeItem('user'); navigate('/login') }

  const NAV_ITEMS = [
    {id:'risk-map', icon:'🗺️', label:'Risk Map Overview'},
    {id:'analytics', icon:'📊', label:'Analytics & Trends'},
    {id:'rainfall', icon:'🌧️', label:'Rainfall Monitoring'},
    {id:'complaints', icon:'📝', label:'Complaints Management'},
    {id:'cctv', icon:'📹', label:'Live CCTV Feeds'},
    {id:'user-management', icon:'👥', label:'User Management'},
    {id:'settings', icon:'⚙️', label:'Settings'},
    {id:'profile', icon:'👤', label:'My Profile'},
  ].filter(item => canAccess(item.id))

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col overflow-hidden" style={{height:'100vh'}}>

      {/* Alert Banner */}
      {showAlert && (
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{background:'linear-gradient(90deg,#dc2626,#ef4444)',minHeight:'44px'}}>
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <span className="text-lg shrink-0">{ALERTS[alertIdx].icon}</span>
            <span className="text-sm font-medium truncate">{ALERTS[alertIdx].text}</span>
            <span className="text-red-300 text-xs shrink-0 hidden md:block">({alertIdx+1}/{ALERTS.length})</span>
          </div>
          <button onClick={()=>setShowAlert(false)} className="text-white/70 hover:text-white ml-4 text-xl shrink-0">×</button>
        </div>
      )}

      {/* Navbar */}
      <nav className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-blue-800" style={{background:'#1e3a8a'}}>
        <div className="flex items-center gap-3">
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="text-white/70 hover:text-white p-1 rounded text-lg">☰</button>
          <div className="w-8 h-8 rounded-lg bg-blue-400/20 flex items-center justify-center">🌊</div>
          <div>
            <div className="font-bold text-sm">Delhi Water-Logging Risk Management System</div>
            <div className="text-xs text-blue-200">Bayesian Ensemble ML Dashboard</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>setActivePage('profile')} className="flex items-center gap-2 hover:bg-blue-700/50 px-2 py-1.5 rounded-lg transition">
            <div className="w-7 h-7 rounded-full bg-blue-400/30 flex items-center justify-center text-sm">👤</div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-blue-200 capitalize">{role}</div>
            </div>
          </button>
          <button onClick={logout} className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded border border-white/20 transition">Logout</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-56 shrink-0 flex flex-col border-r border-slate-700 overflow-y-auto" style={{background:'#0f172a'}}>
            <div className="p-3 border-b border-slate-700">
              <div className="grid grid-cols-2 gap-2">
                {[
                  {label:'Total', value:stats.total, color:'text-blue-400'},
                  {label:'High', value:stats.high, color:'text-red-400'},
                  {label:'Medium', value:stats.medium, color:'text-amber-400'},
                  {label:'Low', value:stats.low, color:'text-emerald-400'},
                ].map((s,i) => (
                  <div key={i} className="bg-slate-800 rounded-lg p-2 text-center">
                    <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <nav className="p-2 flex-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider px-2 py-2 font-medium">Dashboard</div>
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition text-left ${activePage===item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id==='complaints' && pendingCount>0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{pendingCount}</span>
                  )}
                </button>
              ))}

              {(role==='admin' || role==='supervisor') && (
                <>
                  <div className="text-xs text-slate-500 uppercase tracking-wider px-2 py-2 font-medium mt-3">Quick Actions</div>
                  <button onClick={() => setShowHotspotModal(true)} className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-slate-800 rounded-lg transition mb-0.5">➕ Add Hotspot</button>
                  <button onClick={() => setShowEmergencyModal(true)} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition mb-0.5">🔔 Emergency Alert</button>
                  <button onClick={() => {
                    const csv = ['Ward No,Ward Name,Zone,Risk Level,Risk Score,Drainage,Rainfall']
                      .concat(wards.map(w => `${w.wardNo},${w.wardName},${w.zone},${w.riskLevel},${w.riskScore},${w.drainageScore},${w.avgRainfall}`)).join('\n')
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
                    a.download = 'delhi_waterlog_report.csv'; a.click()
                  }} className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-slate-800 rounded-lg transition mb-0.5">📄 Export CSV</button>
                </>
              )}

              {canAccess('dev-tools') && (
                <>
                  <div className="text-xs text-slate-500 uppercase tracking-wider px-2 py-2 font-medium mt-3 border-t border-slate-700 pt-3">🔧 Developer Tools</div>
                  <button onClick={debugML} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition mb-0.5">🐛 Debug ML Data</button>
                  <button onClick={() => setDevOutput(`Map: ${filtered.length} visible / ${wards.length} total\nHigh: ${stats.high}, Med: ${stats.medium}, Low: ${stats.low}`)} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition mb-0.5">🗺️ Verify Map Wards</button>
                  <button onClick={() => setDevOutput(`Markers: ${filtered.length}\nTotal wards: ${wards.length}`)} className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition mb-0.5">📍 Count Markers</button>
                  {devOutput && (
                    <div className="mx-2 mt-2 p-2 bg-slate-800 border border-slate-600 rounded text-xs text-emerald-400 font-mono whitespace-pre-wrap">{devOutput}</div>
                  )}
                </>
              )}

              <div className="text-xs text-slate-500 uppercase tracking-wider px-2 py-2 font-medium mt-3">System Status</div>
              {[
                {label:'IMD Data Feed', s:'active'},
                {label:'Drainage Sensors', s:'active'},
                {label:'Camera Network (85%)', s:'warning'},
                {label:'Alert System', s:'active'},
              ].map((s,i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400">
                  <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${s.s==='active'?'bg-emerald-400':'bg-amber-400'}`}/>
                  {s.label}
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-slate-700">
              <button onClick={() => navigate('/')} className="w-full text-xs text-slate-500 hover:text-white py-1.5 transition">← Back to Home</button>
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto">

          {/* ── RISK MAP ── */}
          {activePage==='risk-map' && (
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between gap-3 flex-wrap shrink-0">
                <div>
                  <h2 className="font-bold text-lg">🗺️ Risk Map Overview</h2>
                  <p className="text-xs text-slate-400">Live ward-level waterlogging risk — Bayesian Ensemble Model</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input placeholder="Search ward..."
                    className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                    value={search} onChange={e=>setSearch(e.target.value)}/>
                  {['all','high','medium','low'].map(r => (
                    <button key={r} onClick={() => setRiskFilter(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition ${riskFilter===r
                        ? r==='high'?'bg-red-600 text-white':r==='medium'?'bg-amber-600 text-white':r==='low'?'bg-emerald-600 text-white':'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                      {r==='all'?`All (${wards.length})`:r==='high'?`🔴 High (${stats.high})`:r==='medium'?`🟡 Med (${stats.medium})`:`🟢 Low (${stats.low})`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-1 overflow-hidden" style={{minHeight:'500px'}}>
                <div className="flex-1">
                  <MapContainer center={[28.6139,77.2090]} zoom={11} style={{height:'100%',width:'100%'}}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© OpenStreetMap © CARTO"/>
                    {filtered.map((ward,i) => (
                      <Marker key={i} position={[ward.lat,ward.lng]} icon={createWardIcon(ward)} eventHandlers={{click:()=>setSelectedWard(ward)}}>
                        <Popup maxWidth={360} minWidth={300}>
                          <div dangerouslySetInnerHTML={{__html:generatePopupHTML(ward)}}/>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
                <div className="w-64 shrink-0 flex flex-col border-l border-slate-700 bg-slate-800/50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-slate-700 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Ward List — {filtered.length} wards
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filtered.map((w,i) => (
                      <div key={i} onClick={() => setSelectedWard(w)}
                        className={`p-2.5 border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition ${selectedWard?.wardNo===w.wardNo?'bg-slate-700':''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white truncate mr-2">{w.wardName}</span>
                          <span className={`text-xs font-bold shrink-0 px-1.5 py-0.5 rounded ${w.riskLevel==='high'?'bg-red-500/20 text-red-400':w.riskLevel==='medium'?'bg-amber-500/20 text-amber-400':'bg-emerald-500/20 text-emerald-400'}`}>
                            {w.riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-slate-400">
                          <span>🌧️ {w.avgRainfall}mm</span><span>💧 {w.drainageScore}/10</span>
                        </div>
                        <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${w.riskScore}%`,background:RISK_COLORS[w.riskLevel]}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {activePage==='analytics' && (
            <div className="p-5">
              <div className="mb-4">
                <h2 className="font-bold text-lg">📊 Analytics & Trends</h2>
                <p className="text-sm text-slate-400">Historical data analysis and predictive insights</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-sm">📈 Risk Trends</h3>
                    <select value={trendPeriod} onChange={e=>setTrendPeriod(Number(e.target.value))} className="bg-slate-700 border border-slate-600 text-white text-xs rounded px-2 py-1">
                      <option value={7}>Last 7 days</option>
                      <option value={30}>Last 30 days</option>
                      <option value={90}>Last 90 days</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={riskTrendData}>
                      <XAxis dataKey="day" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',color:'white',borderRadius:'8px'}}/>
                      <Area type="monotone" dataKey="high" name="High Risk" stroke="#ef4444" fill="#ef444420" strokeWidth={2}/>
                      <Area type="monotone" dataKey="medium" name="Medium" stroke="#f59e0b" fill="#f59e0b20" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3">🗺️ Zone Distribution</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={zoneData}>
                      <XAxis dataKey="zone" tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:'#64748b',fontSize:11}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',color:'white',borderRadius:'8px'}}/>
                      <Bar dataKey="count" name="Total" fill="#3b82f6" radius={[4,4,0,0]}/>
                      <Bar dataKey="high" name="High Risk" fill="#ef4444" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3">🔴 Top 10 Risk Wards</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[...wards].sort((a,b)=>b.riskScore-a.riskScore).slice(0,10).map(w=>({name:w.wardName.split(' ').slice(0,2).join(' '),score:w.riskScore}))} layout="vertical">
                      <XAxis type="number" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false} domain={[0,100]}/>
                      <YAxis type="category" dataKey="name" tick={{fill:'#94a3b8',fontSize:9}} axisLine={false} tickLine={false} width={90}/>
                      <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',color:'white',borderRadius:'8px'}}/>
                      <Bar dataKey="score" name="Risk Score" fill="#ef4444" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3">🤖 Bayesian Model</h3>
                  <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-slate-400 mb-1">Risk Formula (0–100 scale)</p>
                    <code className="text-emerald-400 text-xs">Risk = (Drainage×0.4 + Flood×0.3 + Rainfall×0.3)</code>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[['Accuracy','92.5%'],['Wards',wards.length],['High Risk',stats.high],['Sources','IMD+MCD']].map(([k,v]) => (
                      <div key={k} className="bg-slate-700 rounded-lg p-2.5">
                        <div className="text-xs text-slate-400">{k}</div>
                        <div className="font-bold text-white">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3">💡 Key Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {icon:'📈',title:'Drainage Improvement',desc:'15 wards show 20% improvement after recent upgrades',color:'emerald'},
                    {icon:'⚠️',title:'Rainfall Increase',desc:'North Delhi shows 12% higher rainfall vs last year',color:'amber'},
                    {icon:'🔍',title:'Pattern Detection',desc:'Incidents peak 2-3 hours after heavy rainfall',color:'blue'},
                    {icon:'📉',title:'High Risk Clusters',desc:'3 clusters in Central Delhi need immediate attention',color:'red'},
                  ].map((ins,i) => (
                    <div key={i} className={`p-3 rounded-lg border ${ins.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':ins.color==='amber'?'bg-amber-500/10 border-amber-500/20':ins.color==='blue'?'bg-blue-500/10 border-blue-500/20':'bg-red-500/10 border-red-500/20'}`}>
                      <div className="text-2xl mb-1">{ins.icon}</div>
                      <div className="font-medium text-sm text-white mb-1">{ins.title}</div>
                      <div className="text-xs text-slate-400">{ins.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── RAINFALL ── */}
          {activePage==='rainfall' && (
            <div className="p-5">
              <div className="mb-4">
                <h2 className="font-bold text-lg">🌧️ Rainfall Monitoring</h2>
                <p className="text-sm text-slate-400">Real-time data from 25 IMD stations across Delhi</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[{icon:'🌧️',label:'Current',value:'12.5 mm/hr'},{icon:'📅',label:'Today',value:'47.3 mm'},{icon:'📊',label:'This Month',value:'183 mm'},{icon:'📈',label:'Annual',value:'621 mm'}].map((s,i) => (
                  <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <div className="text-2xl mb-2">{s.icon}</div>
                    <div className="text-xl font-bold text-blue-400">{s.value}</div>
                    <div className="text-xs text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3">📡 Real-time (24h)</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={rainfallData24h}>
                      <XAxis dataKey="hour" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',color:'white',borderRadius:'8px'}}/>
                      <Area type="monotone" dataKey="rainfall" name="Rainfall (mm)" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3">📅 Monthly 2024</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={monthlyRainfall}>
                      <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:'#64748b',fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',color:'white',borderRadius:'8px'}}/>
                      <Bar dataKey="rainfall" name="Rainfall (mm)" fill="#3b82f6" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3">🔔 Rainfall Alerts</h3>
                <div className="space-y-3">
                  {[
                    {icon:'⚠️',title:'Heavy Rainfall Warning',desc:'North Delhi: 50mm expected in 3 hours. Teams on standby.',time:'2h ago',color:'amber'},
                    {icon:'🌧️',title:'Moderate Rainfall',desc:'South & Central Delhi: 15mm/hr. Monitoring active.',time:'4h ago',color:'blue'},
                    {icon:'✅',title:'Rainfall Subsiding',desc:'East Delhi: 5mm/hr. No waterlogging reported.',time:'6h ago',color:'emerald'},
                  ].map((a,i) => (
                    <div key={i} className={`flex gap-3 p-3 rounded-lg border ${a.color==='amber'?'bg-amber-500/10 border-amber-500/20':a.color==='blue'?'bg-blue-500/10 border-blue-500/20':'bg-emerald-500/10 border-emerald-500/20'}`}>
                      <span className="text-2xl shrink-0">{a.icon}</span>
                      <div>
                        <div className="font-medium text-sm text-white">{a.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{a.desc}</div>
                        <div className="text-xs text-slate-500 mt-1">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── COMPLAINTS ── */}
          {activePage==='complaints' && (
            <div className="p-5">
              <div className="mb-4">
                <h2 className="font-bold text-lg">📝 Complaints Management</h2>
                <p className="text-sm text-slate-400">Citizen complaints tracking and resolution</p>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  {label:'Pending', value:pendingCount, color:'red'},
                  {label:'Resolved', value:resolvedCount, color:'emerald'},
                  {label:'Total', value:complaints.length, color:'blue'},
                ].map((s,i) => (
                  <div key={i} className={`rounded-xl p-4 text-center border ${s.color==='red'?'bg-red-500/10 border-red-500/20':s.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':'bg-blue-500/10 border-blue-500/20'}`}>
                    <div className={`text-3xl font-bold ${s.color==='red'?'text-red-400':s.color==='emerald'?'text-emerald-400':'text-blue-400'}`}>{s.value}</div>
                    <div className="text-sm text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
              {complaints.length===0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-16 text-center">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-slate-400 font-medium">No complaints yet</p>
                  <p className="text-slate-500 text-sm mt-1">Citizens can report via the public portal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((c,i) => (
                    <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-mono text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">{c.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${c.severity==='high'?'bg-red-500/10 text-red-400 border-red-500/20':c.severity==='medium'?'bg-amber-500/10 text-amber-400 border-amber-500/20':'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{c.severity?.toUpperCase()}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${c.status==='resolved'?'bg-emerald-500/10 text-emerald-400 border-emerald-500/20':'bg-slate-700 text-slate-400 border-slate-600'}`}>{c.status==='resolved'?'✓ Resolved':'⏳ Pending'}</span>
                          </div>
                          <p className="font-medium text-white text-sm">{c.ward} — {c.location}</p>
                          <p className="text-slate-400 text-sm mt-0.5">{c.description}</p>
                          <p className="text-xs text-slate-500 mt-1">By {c.name} · {c.phone} · {new Date(c.submittedAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0 flex-wrap">
                          <button onClick={() => setViewingComplaint(c)} className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 px-2 py-1.5 rounded-lg transition">👁 View</button>
                          {c.status==='pending' && <button onClick={() => resolveComplaint(i)} className="text-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/30 px-2 py-1.5 rounded-lg transition">✓ Resolve</button>}
                          <button onClick={() => startEdit(c,i)} className="text-xs bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/30 px-2 py-1.5 rounded-lg transition">✏️ Edit</button>
                          <button onClick={() => deleteComplaint(i)} className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 px-2 py-1.5 rounded-lg transition">🗑 Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CCTV ── */}
          {activePage==='cctv' && canAccess('cctv') && (
            <div className="p-5">
              <div className="mb-4">
                <h2 className="font-bold text-lg">📹 Live CCTV Feeds</h2>
                <p className="text-sm text-slate-400">Real-time camera monitoring at high-risk locations</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CCTV_FEEDS.map(cam => (
                  <div key={cam.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition">
                    <div className="relative bg-slate-950 aspect-video flex items-center justify-center">
                      {cam.status==='live' ? (
                        <div className="text-center"><div className="text-6xl mb-2">🎥</div><div className="text-xs text-slate-500">Live Feed — {cam.location}</div></div>
                      ) : (
                        <div className="text-center"><div className="text-5xl mb-2 opacity-30">📵</div><div className="text-xs text-slate-600">Camera Offline</div></div>
                      )}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${cam.status==='live'?'bg-red-500 animate-pulse':'bg-slate-600'}`}/>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cam.status==='live'?'bg-red-600 text-white':'bg-slate-700 text-slate-400'}`}>{cam.status==='live'?'LIVE':'OFFLINE'}</span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${cam.risk==='high'?'bg-red-600/80':cam.risk==='medium'?'bg-amber-600/80':'bg-emerald-600/80'}`}>{cam.risk.toUpperCase()}</span>
                      </div>
                      {cam.status==='live' && <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">💧 {cam.waterLevel}</div>}
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-sm text-white">{cam.location}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{cam.ward} · CAM-{String(cam.id).padStart(3,'0')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex gap-6 text-sm">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"/>{CCTV_FEEDS.filter(c=>c.status==='live').length} Live</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-600"/>{CCTV_FEEDS.filter(c=>c.status==='offline').length} Offline</span>
                  <span className="text-slate-400">Network: 85% operational</span>
                </div>
              </div>
            </div>
          )}

          {/* ── USER MANAGEMENT ── */}
          {activePage==='user-management' && canAccess('user-management') && (
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-bold text-lg">👥 User Management</h2>
                  <p className="text-sm text-slate-400">Manage users, roles, permissions, and complaint reports</p>
                </div>
                {role==='admin' && (
                  <button onClick={() => alert('Add user — connect to backend')} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition">+ Add User</button>
                )}
              </div>

              <div className="mb-6">
                <input placeholder="Search users..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 mb-4"
                  value={userSearch} onChange={e=>setUserSearch(e.target.value)}/>
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-700/50">
                        {['User','Role','Department','Status','Last Login','Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {ALL_USERS.filter(u => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.role.includes(userSearch.toLowerCase())).map((u,i) => (
                        <tr key={i} className="hover:bg-slate-700/30 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-sm font-bold text-blue-400">{u.name.charAt(0)}</div>
                              <div><div className="font-medium text-white text-sm">{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${u.role==='admin'?'bg-purple-500/20 text-purple-400 border-purple-500/30':u.role==='supervisor'?'bg-blue-500/20 text-blue-400 border-blue-500/30':u.role==='analyst'?'bg-cyan-500/20 text-cyan-400 border-cyan-500/30':'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{u.dept}</td>
                          <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">● Active</span></td>
                          <td className="px-4 py-3 text-xs text-slate-400">{u.lastLogin}</td>
                          <td className="px-4 py-3">
                            {role==='admin' && (
                              <div className="flex gap-1">
                                <button onClick={() => alert(`Edit: ${u.name}`)} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-400/10 transition">Edit</button>
                                <button onClick={() => alert(`Deactivate: ${u.name}`)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-400/10 transition">Deactivate</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Complaint Reports */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-sm">📝 Complaint Reports</h3>
                  <div className="flex gap-3 text-sm">
                    <span className="text-red-400 font-bold">{pendingCount} Pending</span>
                    <span className="text-emerald-400 font-bold">{resolvedCount} Resolved</span>
                    <span className="text-blue-400 font-bold">{complaints.length} Total</span>
                  </div>
                </div>
                {complaints.length===0 ? (
                  <div className="text-center py-8 text-slate-500"><div className="text-4xl mb-2">📭</div><p>No complaints filed yet</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {['ID','Reporter','Ward','Location','Severity','Status','Date','Actions'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {complaints.map((c,i) => (
                          <tr key={i} className="hover:bg-slate-700/30 transition">
                            <td className="px-3 py-2.5 font-mono text-xs text-blue-400">{c.id}</td>
                            <td className="px-3 py-2.5 text-xs text-white">{c.name}<br/><span className="text-slate-500">{c.phone}</span></td>
                            <td className="px-3 py-2.5 text-xs text-slate-300">{c.ward}</td>
                            <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[100px] truncate">{c.location}</td>
                            <td className="px-3 py-2.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.severity==='high'?'bg-red-500/20 text-red-400':c.severity==='medium'?'bg-amber-500/20 text-amber-400':'bg-emerald-500/20 text-emerald-400'}`}>{c.severity?.toUpperCase()}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status==='resolved'?'bg-emerald-500/20 text-emerald-400':'bg-slate-600 text-slate-300'}`}>{c.status==='resolved'?'✓ Resolved':'⏳ Pending'}</span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{new Date(c.submittedAt).toLocaleDateString('en-IN')}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex gap-1">
                                <button onClick={() => setViewingComplaint(c)} className="text-xs text-blue-400 px-1.5 py-1 rounded bg-blue-400/10 hover:bg-blue-400/20 transition">👁</button>
                                <button onClick={() => startEdit(c,i)} className="text-xs text-amber-400 px-1.5 py-1 rounded bg-amber-400/10 hover:bg-amber-400/20 transition">✏️</button>
                                {c.status==='pending' && <button onClick={() => resolveComplaint(i)} className="text-xs text-emerald-400 px-1.5 py-1 rounded bg-emerald-400/10 hover:bg-emerald-400/20 transition">✓</button>}
                                <button onClick={() => deleteComplaint(i)} className="text-xs text-red-400 px-1.5 py-1 rounded bg-red-400/10 hover:bg-red-400/20 transition">🗑</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Permissions Matrix */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3">🔐 Role Permissions Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 text-slate-400 pr-4">Permission</th>
                        {['Admin','Supervisor','Analyst','Field Officer','Viewer'].map(r => (
                          <th key={r} className="text-center py-2 text-slate-400 px-3">{r}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {[
                        ['Risk Map',true,true,true,true,true],
                        ['Analytics',true,true,true,false,false],
                        ['Rainfall Monitor',true,true,true,false,false],
                        ['Complaints',true,true,false,true,false],
                        ['CCTV Feeds',true,true,false,false,false],
                        ['User Management',true,false,false,false,false],
                        ['Settings',true,true,true,false,false],
                        ['Developer Tools',true,false,false,false,false],
                      ].map(([perm,...access],i) => (
                        <tr key={i} className="hover:bg-slate-700/20">
                          <td className="py-2 text-slate-300 pr-4 font-medium">{perm}</td>
                          {access.map((a,j) => (
                            <td key={j} className="text-center py-2 px-3"><span className={a?'text-emerald-400':'text-slate-700'}>{a?'✓':'✗'}</span></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activePage==='settings' && canAccess('settings') && (
            <div className="p-5">
              <div className="mb-4"><h2 className="font-bold text-lg">⚙️ Settings</h2><p className="text-sm text-slate-400">System preferences and configuration</p></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  {title:'🔔 Alert Settings', items:[
                    {label:'High Risk Alerts', desc:'Notify when wards cross risk threshold', enabled:true},
                    {label:'IMD Weather Warnings', desc:'Receive IMD rainfall alerts', enabled:true},
                    {label:'Complaint Notifications', desc:'Alert on new citizen complaints', enabled:false},
                    {label:'System Health Alerts', desc:'Camera or sensor failures', enabled:true},
                  ]},
                  {title:'🗺️ Map Settings', items:[
                    {label:'Dark Map Theme', desc:'Use dark CartoDB basemap', enabled:true},
                    {label:'Show Ward Numbers', desc:'Display ward numbers on markers', enabled:true},
                    {label:'Auto-refresh Data', desc:'Refresh predictions every 30 min', enabled:false},
                    {label:'Cluster Markers', desc:'Group nearby markers when zoomed out', enabled:false},
                  ]},
                  {title:'📊 Dashboard Settings', items:[
                    {label:'Show Bayesian Formula', desc:'Display ML formula on analytics page', enabled:true},
                    {label:'Export with Metadata', desc:'Include model info in CSV exports', enabled:true},
                    {label:'Compact Sidebar', desc:'Use icon-only collapsed sidebar', enabled:false},
                  ]},
                  {title:'🔐 Security', items:[
                    {label:'Session Timeout', desc:'Auto logout after 8 hours inactivity', enabled:true},
                    {label:'Audit Logging', desc:'Log all user actions to database', enabled:true},
                    {label:'Two-Factor Auth', desc:'Require OTP on login (admin only)', enabled:false},
                  ]},
                ].map((section,si) => (
                  <div key={si} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                    <h3 className="font-semibold text-sm mb-3">{section.title}</h3>
                    <div className="space-y-3">
                      {section.items.map((item,ii) => (
                        <div key={ii} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                          <div>
                            <div className="text-sm text-white font-medium">{item.label}</div>
                            <div className="text-xs text-slate-400">{item.desc}</div>
                          </div>
                          <button onClick={() => alert(`Toggle: ${item.label}`)}
                            className={`w-10 h-5 rounded-full transition-all relative shrink-0 ml-4 ${item.enabled?'bg-blue-600':'bg-slate-600'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${item.enabled?'left-5':'left-0.5'}`}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {role==='admin' && (
                <div className="mt-4 bg-red-950/30 border border-red-800/40 rounded-xl p-4">
                  <h3 className="font-semibold text-sm text-red-400 mb-3">⚠️ Danger Zone</h3>
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => { if(window.confirm('Clear all complaints?')){ localStorage.removeItem('complaints'); setComplaints([]); alert('Cleared.') }}}
                      className="text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 px-4 py-2 rounded-lg transition">🗑️ Clear All Complaints</button>
                    <button onClick={() => alert('Reset — connect to backend')}
                      className="text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 px-4 py-2 rounded-lg transition">🔄 Reset ML Predictions</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE ── */}
          {activePage==='profile' && canAccess('profile') && (
            <div className="p-5 max-w-2xl">
              <div className="mb-4"><h2 className="font-bold text-lg">👤 My Profile</h2><p className="text-sm text-slate-400">Your account information</p></div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 rounded-full bg-blue-600/20 border-2 border-blue-600/40 flex items-center justify-center text-4xl shrink-0">{user?.name?.charAt(0)||'👤'}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                    <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mt-1 mb-3 ${role==='admin'?'bg-purple-500/20 text-purple-400 border border-purple-500/30':role==='supervisor'?'bg-blue-500/20 text-blue-400 border border-blue-500/30':role==='analyst'?'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30':'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                      🛡️ {role.charAt(0).toUpperCase()+role.slice(1)}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ['🆔 Employee ID', user?.employeeId],
                        ['📧 Email', `${user?.employeeId?.toLowerCase()}@mcd.gov.in`],
                        ['🏢 Organization', 'Municipal Corporation of Delhi'],
                        ['📅 Login Time', new Date().toLocaleTimeString('en-IN')],
                      ].map(([k,v]) => (
                        <div key={k} className="bg-slate-700/50 rounded-lg p-2.5">
                          <div className="text-xs text-slate-400 mb-0.5">{k}</div>
                          <div className="text-white font-medium text-sm">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4">
                <h3 className="font-semibold text-sm mb-3">🔐 Access Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {ROLE_ACCESS[role]?.map(p => (
                    <span key={p} className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2.5 py-1 rounded-full capitalize">✓ {p.replace(/-/g,' ')}</span>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3">📊 Complaint Stats</h3>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    {label:'Total', value:complaints.length, color:'blue'},
                    {label:'Pending', value:pendingCount, color:'red'},
                    {label:'Resolved', value:resolvedCount, color:'emerald'},
                  ].map((s,i) => (
                    <div key={i} className={`rounded-lg p-3 text-center border ${s.color==='blue'?'bg-blue-500/10 border-blue-500/20':s.color==='red'?'bg-red-500/10 border-red-500/20':'bg-emerald-500/10 border-emerald-500/20'}`}>
                      <div className={`text-2xl font-bold ${s.color==='blue'?'text-blue-400':s.color==='red'?'text-red-400':'text-emerald-400'}`}>{s.value}</div>
                      <div className="text-xs text-slate-400">{s.label}</div>
                    </div>
                  ))}
                </div>
                <button onClick={logout} className="w-full py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-xl text-sm transition">🚪 Sign Out</button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── VIEW COMPLAINT MODAL ── */}
      {viewingComplaint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Complaint Details</h3>
              <button onClick={() => setViewingComplaint(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Complaint ID', viewingComplaint.id],
                ['Reporter', viewingComplaint.name],
                ['Phone', viewingComplaint.phone],
                ['Ward / Area', viewingComplaint.ward],
                ['Location', viewingComplaint.location],
                ['Severity', viewingComplaint.severity?.toUpperCase()],
                ['Status', viewingComplaint.status],
                ['Submitted', new Date(viewingComplaint.submittedAt).toLocaleString('en-IN')],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">{k}</span>
                  <span className="text-white font-medium text-right max-w-[200px]">{v}</span>
                </div>
              ))}
              <div>
                <div className="text-slate-400 mb-1">Description</div>
                <div className="text-white bg-slate-700/50 rounded-lg p-3 text-xs leading-relaxed">{viewingComplaint.description}</div>
              </div>
            </div>
            <button onClick={() => setViewingComplaint(null)} className="w-full mt-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition">Close</button>
          </div>
        </div>
      )}

      {/* ── EDIT COMPLAINT MODAL ── */}
      {editingComplaint !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Edit Complaint</h3>
              <button onClick={() => setEditingComplaint(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              {[{key:'ward',label:'Ward / Area'},{key:'location',label:'Location'},{key:'name',label:'Reporter Name'},{key:'phone',label:'Phone'}].map(({key,label}) => (
                <div key={key}>
                  <label className="block text-xs text-slate-400 mb-1">{label}</label>
                  <input value={editForm[key]||''} onChange={e => setEditForm({...editForm,[key]:e.target.value})}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Severity</label>
                <select value={editForm.severity||''} onChange={e => setEditForm({...editForm,severity:e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select value={editForm.status||''} onChange={e => setEditForm({...editForm,status:e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea rows={3} value={editForm.description||''} onChange={e => setEditForm({...editForm,description:e.target.value})}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"/>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditingComplaint(null)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition">Cancel</button>
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD HOTSPOT MODAL ── */}
      {showHotspotModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">➕ Add Hotspot</h3>
              <button onClick={() => setShowHotspotModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ward / Area *</label>
                <input placeholder="e.g. Rohini, Ward 21"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
                  value={hotspotForm.ward} onChange={e => setHotspotForm({...hotspotForm, ward:e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Exact Location *</label>
                <input placeholder="Street, landmark, colony"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
                  value={hotspotForm.location} onChange={e => setHotspotForm({...hotspotForm, location:e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Risk Level</label>
                <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={hotspotForm.severity} onChange={e => setHotspotForm({...hotspotForm, severity:e.target.value})}>
                  <option value="high">🔴 High Risk</option>
                  <option value="medium">🟡 Medium Risk</option>
                  <option value="low">🟢 Low Risk</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Reason / Notes</label>
                <textarea rows={3} placeholder="Why is this a hotspot? Drainage failure, flooding history..."
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 resize-none"
                  value={hotspotForm.reason} onChange={e => setHotspotForm({...hotspotForm, reason:e.target.value})}/>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowHotspotModal(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition">Cancel</button>
              <button onClick={() => {
                if (!hotspotForm.ward || !hotspotForm.location) { alert('Please fill Ward and Location'); return }
                const newHS = { ...hotspotForm, id:'HS-'+Date.now().toString().slice(-5), addedBy:user?.name, addedAt:new Date().toISOString() }
                const updated = [...hotspots, newHS]
                setHotspots(updated)
                localStorage.setItem('hotspots', JSON.stringify(updated))
                setHotspotForm({ ward:'', location:'', severity:'high', reason:'' })
                setShowHotspotModal(false)
                alert(`✅ Hotspot added!\nID: ${newHS.id}\nLocation: ${newHS.ward} — ${newHS.location}`)
              }} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition">Add Hotspot</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMERGENCY ALERT MODAL ── */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-lg text-red-400">🚨 Emergency Alert</h3>
              <button onClick={() => setShowEmergencyModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Notifies all field officers in the selected zone</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Alert Type</label>
                <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  value={emergencyForm.alertType} onChange={e => setEmergencyForm({...emergencyForm, alertType:e.target.value})}>
                  <option value="flood">🌊 Flash Flood Warning</option>
                  <option value="drainage">💧 Drainage System Failure</option>
                  <option value="evacuation">🚨 Evacuation Required</option>
                  <option value="standby">⚡ Team Standby Alert</option>
                  <option value="allclear">✅ All Clear</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Zone</label>
                <select className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  value={emergencyForm.zone} onChange={e => setEmergencyForm({...emergencyForm, zone:e.target.value})}>
                  <option value="all">📍 All Delhi</option>
                  <option value="north">North Delhi</option>
                  <option value="south">South Delhi</option>
                  <option value="east">East Delhi</option>
                  <option value="west">West Delhi</option>
                  <option value="central">Central Delhi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Alert Message *</label>
                <textarea rows={3} placeholder="Describe the emergency situation and required action..."
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-slate-500 resize-none"
                  value={emergencyForm.message} onChange={e => setEmergencyForm({...emergencyForm, message:e.target.value})}/>
              </div>
              <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-3 text-xs text-red-300">
                ⚠️ This alert will be sent to all active field officers and supervisors in the selected zone.
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowEmergencyModal(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition">Cancel</button>
              <button onClick={() => {
                if (!emergencyForm.message) { alert('Please enter an alert message'); return }
                const types = { flood:'🌊 Flash Flood Warning', drainage:'💧 Drainage Failure', evacuation:'🚨 Evacuation', standby:'⚡ Standby Alert', allclear:'✅ All Clear' }
                setShowEmergencyModal(false)
                setEmergencyForm({ zone:'all', message:'', alertType:'flood' })
                alert(`🚨 Emergency Alert Dispatched!\n\nType: ${types[emergencyForm.alertType]}\nZone: ${emergencyForm.zone.toUpperCase()} DELHI\nMessage: ${emergencyForm.message}\n\nAll field officers notified.`)
              }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-semibold transition">🚨 Send Alert</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
