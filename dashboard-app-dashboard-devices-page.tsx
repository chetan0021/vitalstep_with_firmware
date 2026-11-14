// app/dashboard/devices/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, ChevronDown } from 'lucide-react'

interface Device {
  id: string
  device_code: string
  device_secret: string
  status: string
  paired_user_id?: string
  paired_at?: string
  created_at: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadDevices()
  }, [])

  useEffect(() => {
    filterDevices()
  }, [devices, searchTerm, statusFilter])

  const loadDevices = async () => {
    try {
      const { data } = await supabase
        .from('device_inventory')
        .select('*')
        .order('created_at', { ascending: false })

      setDevices(data || [])
    } catch (error) {
      console.error('Error loading devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDevices = () => {
    let filtered = devices

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((d) =>
        d.device_code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }

    setFilteredDevices(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'manufactured':
        return 'bg-yellow-100 text-yellow-800'
      case 'paired':
        return 'bg-green-100 text-green-800'
      case 'in_field':
        return 'bg-blue-100 text-blue-800'
      case 'retired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Device Inventory</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search device code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent appearance-none bg-white pr-8"
            >
              <option value="all">All Status</option>
              <option value="manufactured">Manufactured</option>
              <option value="paired">Paired</option>
              <option value="in_field">In Field</option>
              <option value="retired">Retired</option>
            </select>
            <ChevronDown
              className="absolute right-3 top-3 text-gray-400 pointer-events-none"
              size={20}
            />
          </div>
        </div>

        <p className="text-gray-600 mt-4">
          Total: <span className="font-semibold">{filteredDevices.length}</span> device
          {filteredDevices.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 mt-4">Loading devices...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No devices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Device Code
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-sm font-bold text-indigo-600">
                      {device.device_code}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                          device.status
                        )}`}
                      >
                        {device.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(device.created_at).toLocaleDateString()} at{' '}
                      {new Date(device.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3">
                      <button className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
