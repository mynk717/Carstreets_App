// app/admin/content/monitor/page.tsx
'use client'

import { useState, useEffect } from 'react'

interface Metrics {
  weekly_usage: number
  quality_scores: number[]
  failed_generations: number
  average_uniqueness: number
}

interface MetricCardProps {
  title: string
  value: string
  status: 'normal' | 'limit_reached' | 'excellent' | 'needs_improvement'
}

// ✅ Missing MetricCard component
function MetricCard({ title, value, status }: MetricCardProps) {
  const statusColors = {
    normal: 'bg-blue-50 border-blue-200 text-blue-800',
    limit_reached: 'bg-red-50 border-red-200 text-red-800',
    excellent: 'bg-green-50 border-green-200 text-green-800',
    needs_improvement: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

// ✅ Missing PipelineStatusView component
function PipelineStatusView() {
  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Pipeline Status</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span>Research Agent</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Active</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Content Generator</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Active</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Quality Control</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Monitoring</span>
        </div>
      </div>
    </div>
  )
}

// ✅ Missing ContentApprovalQueue component
function ContentApprovalQueue() {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-4">Content Approval Queue</h2>
      <div className="text-gray-500 text-center py-8">
        <div className="text-4xl mb-2">📋</div>
        <p>No content pending approval</p>
      </div>
    </div>
  )
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    weekly_usage: 0,
    quality_scores: [],
    failed_generations: 0,
    average_uniqueness: 0
  })
  
  useEffect(() => {
    // Fetch metrics from API
    // setMetrics(data)
  }, [])
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Content Generation Monitor</h1>
      
      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          title="Weekly Usage" 
          value={`${metrics.weekly_usage}/4`}
          status={metrics.weekly_usage >= 4 ? 'limit_reached' : 'normal'}
        />
        <MetricCard 
          title="Average Quality" 
          value={`${metrics.average_uniqueness}%`}
          status={metrics.average_uniqueness >= 90 ? 'excellent' : 'needs_improvement'}
        />
        <MetricCard 
          title="Success Rate" 
          value={`${metrics.weekly_usage > 0 ? Math.round(100 - (metrics.failed_generations / metrics.weekly_usage * 100)) : 100}%`}
          status="normal"
        />
      </div>
      
      {/* Pipeline Status */}
      <PipelineStatusView />
      
      {/* Content Queue */}
      <ContentApprovalQueue />
    </div>
  )
}
