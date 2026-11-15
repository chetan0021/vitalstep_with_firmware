'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function GeneratePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ device_code: string; device_secret: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [prefix, setPrefix] = useState('VS')

  const generate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      // Generate code: prefix + 6 random digits
      const digits = Math.floor(100000 + Math.random() * 900000).toString()
      const device_code = `${prefix}-${digits}`

      // Generate 64-char hex secret
      const bytes = crypto.getRandomValues(new Uint8Array(32))
      const device_secret = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

      // Get current admin id from localStorage token
      const token = localStorage.getItem('access_token')
      let admin_id: string | null = null
      if (token) {
        // Decode JWT payload to get user ID
        const payload = JSON.parse(atob(token.split('.')[1]))
        admin_id = payload.sub
      }

      // Insert into device_inventory
      const { error: insertError } = await supabase
        .from('device_inventory')
        .insert({
          device_code,
          device_secret,
          status: 'manufactured',
          created_by: admin_id,
        })

      if (insertError) throw new Error(insertError.message)

      // Log to device_audit
      if (admin_id) {
        await supabase.from('device_audit').insert({
          admin_id,
          action: 'create',
          device_code,
          details: 'Device code generated from admin dashboard',
        })
      }

      setResult({ device_code, device_secret })
    } catch (err: any) {
      setError(err.message || 'Failed to generate device code')
    }
    setLoading(false)
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Generate Device Code</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '15px' }}>Creates a new entry in <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>device_inventory</code></p>
      </div>

      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', padding: '28px' }}>
        {/* Prefix Setting */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '7px' }}>Device Code Prefix</label>
          <input
            type="text"
            value={prefix}
            onChange={e => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={6}
            style={{ width: '120px', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
          />
          <span style={{ marginLeft: '10px', fontSize: '13px', color: '#94a3b8' }}>e.g. VS-001234</span>
        </div>

        {/* Generate Button */}
        <button
          onClick={generate}
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 14px rgba(59,130,246,0.3)',
          }}
        >
          {loading ? '⏳ Saving to Supabase…' : '⚡ Generate & Save to Supabase'}
        </button>

        {/* Error */}
        {error && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '9px', color: '#dc2626', fontSize: '13px', fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '9px', color: '#065f46', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
              ✅ Saved to Supabase device_inventory!
            </div>

            {/* Code */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Device Code</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, padding: '12px 16px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '9px', fontFamily: 'monospace', fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '3px', textAlign: 'center' }}>
                  {result.device_code}
                </div>
                <button onClick={() => copy(result.device_code, 'code')} style={{ padding: '12px 14px', background: copied === 'code' ? '#ecfdf5' : '#f1f5f9', border: `1px solid ${copied === 'code' ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '9px', cursor: 'pointer', fontSize: '18px' }}>
                  {copied === 'code' ? '✅' : '📋'}
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Flash this into the ESP32 firmware.</div>
            </div>

            {/* Secret */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Device Secret <span style={{ color: '#ef4444', fontWeight: 500, textTransform: 'none' }}>— keep private</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, padding: '12px 14px', background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '9px', fontFamily: 'monospace', fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.device_secret}
                </div>
                <button onClick={() => copy(result.device_secret, 'secret')} style={{ padding: '12px 14px', background: copied === 'secret' ? '#ecfdf5' : '#f1f5f9', border: `1px solid ${copied === 'secret' ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '9px', cursor: 'pointer', fontSize: '18px', flexShrink: 0 }}>
                  {copied === 'secret' ? '✅' : '📋'}
                </button>
              </div>
            </div>

            {/* Next Steps */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>📌 Next Steps</div>
              {[
                'Flash device_code into ESP32 firmware config',
                'Power on device near Wi-Fi network',
                'Device auto-registers on first boot',
                'Status changes from manufactured → paired',
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ fontSize: '12px', color: '#1e40af' }}>{s}</span>
                </div>
              ))}
            </div>

            <a href="/dashboard/devices" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '14px', color: '#3b82f6', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              View in Device Inventory →
            </a>
          </div>
        )}

        {!result && !loading && (
          <div style={{ marginTop: '32px', textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>⚡</div>
            <div style={{ fontSize: '14px' }}>Generated codes are saved directly to Supabase.</div>
          </div>
        )}
      </div>
    </div>
  )
}
