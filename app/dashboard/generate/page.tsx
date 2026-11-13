// app/dashboard/generate/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Download, Copy, Check, AlertCircle, Loader } from 'lucide-react'

interface GeneratedDevice {
  device_code: string
  device_secret: string
  created_at: string
}

export default function GeneratePage() {
  const [device, setDevice] = useState<GeneratedDevice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const generateDevice = async () => {
    setError('')
    setLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await fetch(
        process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL!,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate device')
        return
      }

      setDevice(data)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadSDFiles = () => {
    if (!device) return

    // Download devicecode.txt
    downloadFile('devicecode.txt', device.device_code)

    // Download devicesecret.txt
    setTimeout(() => {
      downloadFile('devicesecret.txt', device.device_secret)
    }, 100)
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Generate Device ID</h1>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Generate Button Section */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Create New Device
          </h2>
          <p className="text-gray-600 mb-8">
            Click the button below to generate a new device code and secret
          </p>

          <button
            onClick={generateDevice}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
          >
            {loading && <Loader size={20} className="animate-spin" />}
            {loading ? 'Generating...' : 'Generate Device ID'}
          </button>
        </div>
      </div>

      {/* Device Details Section */}
      {device && (
        <div className="space-y-6">
          {/* Device Code */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Device Code</h3>
            <div className="flex gap-4 items-center mb-4">
              <div className="flex-1 bg-gray-50 p-4 rounded-lg font-mono text-xl font-bold text-gray-900 break-all">
                {device.device_code}
              </div>
              <button
                onClick={() => copyToClipboard(device.device_code, 'code')}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition"
              >
                {copied === 'code' ? (
                  <>
                    <Check size={18} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-gray-600 text-sm">Save this in devicecode.txt on SD card</p>
          </div>

          {/* Device Secret */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Device Secret (SHA256)</h3>
            <div className="flex gap-4 items-center mb-4">
              <div className="flex-1 bg-gray-50 p-4 rounded-lg font-mono text-sm text-gray-900 break-all">
                {device.device_secret}
              </div>
              <button
                onClick={() => copyToClipboard(device.device_secret, 'secret')}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg transition flex-shrink-0"
              >
                {copied === 'secret' ? (
                  <>
                    <Check size={18} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-gray-600 text-sm">Save this in devicesecret.txt on SD card</p>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Metadata</h3>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">Created:</span>{' '}
                {new Date(device.created_at).toLocaleString()}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Status:</span> <span className="text-yellow-700">Manufactured</span>
              </p>
            </div>
          </div>

          {/* Download SD Files */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Download SD Card Files</h3>
            <p className="text-gray-600 mb-4">
              Download these files and place them on the device's SD card
            </p>
            <button
              onClick={downloadSDFiles}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              <Download size={20} />
              Download Files
            </button>
            <div className="mt-4 text-sm text-gray-600">
              <p className="mb-2">This will download:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code className="bg-gray-100 px-2 py-1 rounded">devicecode.txt</code> - 8 bytes</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">devicesecret.txt</code> - 64 bytes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
