'use client'

import { useState, useEffect } from 'react'
import { Candidate } from '@/types'
import { supabase } from '@/lib/supabase'
import VoteSection from '@/components/VoteSection'
import { RefreshCw } from 'lucide-react'

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const [nextRefreshIn, setNextRefreshIn] = useState(30)

  const fetchCandidates = async (isAutoRefresh: boolean = false) => {
    try {
      if (isAutoRefresh) {
        setIsAutoRefreshing(true)
      }

      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('votes', { ascending: false })

      if (error) {
        console.error('Error fetching candidates:', error)
        return
      }

      setCandidates(data || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
      if (isAutoRefresh) {
        setTimeout(() => setIsAutoRefreshing(false), 1000) // Show indicator for 1 second
      }
    }
  }

  useEffect(() => {
    fetchCandidates()

    // Set up real-time subscription
    const subscription = supabase
      .channel('candidates_main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
        fetchCandidates()
        setNextRefreshIn(30) // Reset countdown when real-time update occurs
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Separate useEffect for auto-refresh and countdown
  useEffect(() => {
    // Set up automatic refresh every 30 seconds
    const autoRefreshInterval = setInterval(() => {
      console.log('Auto-refreshing...')
      fetchCandidates(true) // Mark as auto-refresh
      setNextRefreshIn(30) // Reset countdown
    }, 30000) // 30 seconds

    // Set up countdown timer (updates every second)
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        const newValue = prev <= 1 ? 30 : prev - 1
        console.log('Countdown:', newValue)
        return newValue
      })
    }, 1000) // 1 second

    return () => {
      clearInterval(autoRefreshInterval)
      clearInterval(countdownInterval)
    }
  }, [])

  // All candidates (no filtering by position)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading election results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Philippine Election Results 2025</h1>
              <p className="text-gray-600 mt-1">Real-time Vote Tallying System</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                              <button
                onClick={() => {
                  fetchCandidates(false)
                  setNextRefreshIn(30) // Reset countdown on manual refresh
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
                
                {isAutoRefreshing && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Auto-updating...</span>
                  </div>
                )}
              </div>
              
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
                <p className="text-xs text-gray-400">
                  Next auto-refresh in: {nextRefreshIn}s
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Candidates Results */}
          <VoteSection
            title="Candidates"
            candidates={candidates}
            position="candidate"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>Vote Tallying System - MVP</p>
            <p className="text-sm mt-1">
              Manual vote entry system for election results tracking
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
