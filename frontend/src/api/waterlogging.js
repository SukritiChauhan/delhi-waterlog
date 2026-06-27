const API_URL = 'https://delhi-waterlog.onrender.com'

export async function fetchAllWardPredictions(wards) {
  try {
    const payload = wards.map((ward, index) => ({
      ward_no: String(ward.wardNo),
      ward_name: ward.wardName,
      lat: ward.lat,
      lng: ward.lng,
      index: index
    }))

    const response = await fetch(`${API_URL}/predict/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) throw new Error('API failed')

    const data = await response.json()
    
    return data.predictions.map(p => ({
      wardNo: p.ward_no,
      wardName: p.ward_name,
      wardKey: p.ward_key,
      zone: getZone(p.ward_name, p.lat, p.lng),
      lat: p.lat,
      lng: p.lng,
      avgRainfall: p.avg_rainfall,
      drainageScore: p.drainage_score,
      riskLevel: p.risk_level,
      riskScore: p.risk_score,
      mlConfidence: p.ml_confidence,
      historicalIncidents: p.historical_incidents,
      floodRisk: p.flood_risk,
      systemAge: p.system_age,
      sewageCoverage: p.sewage_coverage,
      lastUpdated: new Date().toISOString()
    }))
  } catch (error) {
    console.error('API error, falling back to local data:', error)
    return null // fallback to wardData.js
  }
}

function getZone(name, lat, lng) {
  const n = name.toLowerCase()
  if (n.includes('north') || lat > 28.7) return 'north'
  if (n.includes('south') || lat < 28.55) return 'south'
  if (n.includes('east') || lng > 77.25) return 'east'
  if (n.includes('west') || lng < 77.1) return 'west'
  return 'central'
}

export async function fetchWardPrediction(wardKey, wardNo, wardName, lat, lng) {
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ward_key: wardKey, ward_no: wardNo, ward_name: wardName, lat, lng })
    })
    if (!response.ok) throw new Error('API failed')
    return await response.json()
  } catch (error) {
    console.error('Prediction API error:', error)
    return null
  }
}