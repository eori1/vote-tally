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
  const [showAllCandidates, setShowAllCandidates] = useState(false)

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
      fetchCandidates(true) // Mark as auto-refresh
      setNextRefreshIn(30) // Reset countdown
    }, 30000) // 30 seconds

    // Set up countdown timer (updates every second)
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        const newValue = prev <= 1 ? 30 : prev - 1
        return newValue
      })
    }, 1000) // 1 second

    return () => {
      clearInterval(autoRefreshInterval)
      clearInterval(countdownInterval)
    }
  }, [])

  // Group candidates by position/office
  const groupedCandidates = candidates.reduce((groups, candidate) => {
    const position = candidate.party || 'Other'
    if (!groups[position]) {
      groups[position] = []
    }
    groups[position].push(candidate)
    return groups
  }, {} as Record<string, Candidate[]>)

  // Define position order: BOD first, then Audit Committee, then Election Committee
  const positionOrder = ['Board of Director (BOD)', 'Audit Committee', 'Election Committee']
  const positions = positionOrder.filter(position => groupedCandidates[position])

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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">30th HICEMPO General Assembly</h1>
              <p className="text-gray-600 mt-1">Real-time Vote Tallying System</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-3">
                <button
                onClick={() => {
                  fetchCandidates(false)
                  setNextRefreshIn(30) // Reset countdown on manual refresh
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
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
              
              <div className="mt-1 space-y-0.5">
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
      <main className="flex-1 max-w-[1600px] mx-auto px-4 py-6 w-full">
        <div className="space-y-6">
          {/* Summary Section */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-gray-900">Election Overview</h2>
              <button
                onClick={() => setShowAllCandidates(!showAllCandidates)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <span>{showAllCandidates ? 'Show Top 4' : 'Show All Candidates'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {positions.map(position => {
                const positionCandidates = groupedCandidates[position]
                const totalVotes = positionCandidates.reduce((sum, candidate) => sum + candidate.votes, 0)
                return (
                  <div key={position} className="bg-gray-50 rounded-lg p-3">
                    <h3 className="font-semibold text-base text-gray-800">{position}</h3>
                    <p className="text-sm text-gray-600">{positionCandidates.length} candidates</p>
                    <p className="text-blue-600 font-medium text-lg">{totalVotes.toLocaleString()} total votes</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Position Results - Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-6">
            {/* Board of Directors (BOD) - Left Column */}
            {groupedCandidates['Board of Director (BOD)'] && (
              <div className="order-1">
                <VoteSection
                  title="Board of Director (BOD)"
                  candidates={groupedCandidates['Board of Director (BOD)']}
                  showAll={showAllCandidates}
                />
              </div>
            )}

            {/* Audit Committee - Middle Column */}
            {groupedCandidates['Audit Committee'] && (
              <div className="order-2">
                <VoteSection
                  title="Audit Committee"
                  candidates={groupedCandidates['Audit Committee']}
                  showAll={showAllCandidates}
                />
              </div>
            )}

            {/* Election Committee - Right Column */}
            {groupedCandidates['Election Committee'] && (
              <div className="order-3">
                <VoteSection
                  title="Election Committee"
                  candidates={groupedCandidates['Election Committee']}
                  showAll={showAllCandidates}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="text-center text-gray-600">
            <p className="text-sm font-medium">Vote Tallying System</p>
            <p className="text-xs mt-1">
              Manual vote entry system for election results tracking
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
