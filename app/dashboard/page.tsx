// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, Users, Activity, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalDevices: number
  manufacturedDevices: number
  pairedDevices: number
  recentDevices: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalDevices: 0,
    manufacturedDevices: 0,
    pairedDevices: 0,
    recentDevices: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get all devices
        const { data: allDevices } = await supabase
          .from('device_inventory')
          .select('*')
          .order('created_at', { ascending: false })

        const manufactured =
          allDevices?.filter((d) => d.status === 'manufactured').length || 0
        const paired =
          allDevices?.filter((d) => d.status === 'paired').length || 0

        setStats({
          totalDevices: allDevices?.length || 0,
          manufacturedDevices: manufactured,
          pairedDevices: paired,
          recentDevices: (allDevices || []).slice(0, 5),
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const StatCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any
    label: string
    value: number
  }) => (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <Icon className="text-indigo-600" size={40} />
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to VitalStep Admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Package} label="Total Devices" value={stats.totalDevices} />
        <StatCard
          icon={TrendingUp}
          label="Manufactured"
          value={stats.manufacturedDevices}
        />
        <StatCard icon={Activity} label="Paired" value={stats.pairedDevices} />
        <StatCard
          icon={Users}
          label="In Field"
          value={stats.totalDevices - stats.pairedDevices}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/dashboard/generate"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-6 transition transform hover:scale-105"
        >
          <div className="text-3xl mb-2">🔧</div>
          <h3 className="text-xl font-bold">Generate Device ID</h3>
          <p className="text-indigo-100 mt-2">Create a new device code</p>
        </Link>

        <Link
          href="/dashboard/devices"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 transition transform hover:scale-105"
        >
          <div className="text-3xl mb-2">📋</div>
          <h3 className="text-xl font-bold">View Inventory</h3>
          <p className="text-blue-100 mt-2">Manage all devices</p>
        </Link>
      </div>

      {/* Recent Devices */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Devices</h2>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {stats.recentDevices.map((device) => (
                <tr key={device.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-sm text-gray-900">
                    {device.device_code}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        device.status === 'manufactured'
                          ? 'bg-yellow-100 text-yellow-800'
                          : device.status === 'paired'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(device.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
