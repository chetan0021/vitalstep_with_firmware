// app/dashboard/audit/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, User, Package } from 'lucide-react'

interface AuditLog {
  id: string
  admin_id: string
  action: string
  device_code: string
  details: string
  created_at: string
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async () => {
    try {
      const { data } = await supabase
        .from('device_audit')
        .select('*')
        .order('created_at', { ascending: false })

      setLogs(data || [])
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'generated':
        return <Package size={18} className="text-green-600" />
      case 'paired':
        return <User size={18} className="text-blue-600" />
      case 'retired':
        return <Package size={18} className="text-red-600" />
      default:
        return <Package size={18} className="text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'generated':
        return 'bg-green-50 border-l-4 border-green-600'
      case 'paired':
        return 'bg-blue-50 border-l-4 border-blue-600'
      case 'retired':
        return 'bg-red-50 border-l-4 border-red-600'
      default:
        return 'bg-gray-50 border-l-4 border-gray-600'
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Audit Log</h1>

      {/* Logs */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-4">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No audit logs found</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`${getActionColor(log.action)} rounded-lg shadow p-6`}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">{getActionIcon(log.action)}</div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        Device {log.action}
                      </h3>
                      <p className="text-gray-700 mt-1">{log.details}</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Package size={16} />
                      <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                        {log.device_code}
                      </code>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
