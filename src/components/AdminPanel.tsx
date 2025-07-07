'use client'

import { useState } from 'react'
import { Candidate } from '@/types'
import { supabase } from '@/lib/supabase'
import { Settings, Save } from 'lucide-react'

interface AdminPanelProps {
  candidates: Candidate[]
  onUpdate: () => void
}

export default function AdminPanel({ candidates, onUpdate }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [voteUpdates, setVoteUpdates] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)

  const handleVoteChange = (candidateId: number, votes: number) => {
    setVoteUpdates(prev => ({
      ...prev,
      [candidateId]: votes
    }))
  }

  const handleSaveVotes = async () => {
    setLoading(true)
    try {
      const updates = Object.entries(voteUpdates).map(([id, votes]) => ({
        id: parseInt(id),
        votes: Math.min(votes, 2147483647) // Limit to max integer value
      }))

      for (const update of updates) {
        const { error } = await supabase
          .from('candidates')
          .update({ votes: update.votes })
          .eq('id', update.id)

        if (error) {
          console.error('Error updating votes:', error)
          alert('Error updating votes: ' + (error.message || 'Unknown error'))
          return
        }
      }

      setVoteUpdates({})
      onUpdate()
      alert('Votes updated successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating votes: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const allCandidates = candidates

  return (
    <>
      {/* Floating Admin Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-colors z-50"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Admin Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Admin Panel - Update Votes</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                {/* All Candidates */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-blue-700">All Candidates</h3>
                  <div className="space-y-4">
                    {allCandidates.map(candidate => (
                      <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="font-semibold text-gray-900">{candidate.name}</div>
                        {candidate.party && (
                          <div className="text-sm text-gray-600">({candidate.party})</div>
                        )}
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Votes
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={voteUpdates[candidate.id] ?? candidate.votes}
                            onChange={(e) => handleVoteChange(candidate.id, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVotes}
                  disabled={loading || Object.keys(voteUpdates).length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 