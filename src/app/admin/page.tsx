'use client'

import { useState, useEffect } from 'react'
import { Candidate } from '@/types'
import { supabase } from '@/lib/supabase'
import { Plus, Minus, RefreshCw, ArrowLeft, UserPlus, Trash2, X } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const [voteInputs, setVoteInputs] = useState<Record<number, string>>({})
  const [lastUpdateTime, setLastUpdateTime] = useState<Record<number, number>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    party: '',
    description: ''
  })

  const positions = ['Board of Director (BOD)', 'Audit Committee', 'Election Committee']
  const [addingCandidate, setAddingCandidate] = useState(false)
  const [removingCandidate, setRemovingCandidate] = useState<number | null>(null)

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('position', { ascending: true })
        .order('votes', { ascending: false })

      if (error) {
        console.error('Error fetching candidates:', error)
        return
      }

      setCandidates(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()

    // Set up real-time subscription with immediate response
    const subscription = supabase
      .channel('candidates_admin')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'candidates' 
      }, (payload) => {
        console.log('Real-time update received:', payload)
        // Update the specific candidate in state immediately
        setCandidates(prev => prev.map(candidate => 
          candidate.id === payload.new.id 
            ? { ...candidate, votes: payload.new.votes }
            : candidate
        ))
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'candidates' 
      }, (payload) => {
        console.log('Real-time insert received:', payload)
        // Add the new candidate to state
        setCandidates(prev => [...prev, payload.new as Candidate])
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'candidates' 
      }, (payload) => {
        console.log('Real-time delete received:', payload)
        // Remove the candidate from state
        setCandidates(prev => prev.filter(candidate => candidate.id !== payload.old.id))
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const updateVotes = async (candidateId: number, change: number) => {
    // Prevent rapid consecutive clicks
    const now = Date.now()
    const lastUpdate = lastUpdateTime[candidateId] || 0
    if (now - lastUpdate < 500) { // 500ms delay between updates
      console.log('Update too rapid, ignoring...')
      return
    }
    setLastUpdateTime(prev => ({ ...prev, [candidateId]: now }))

    setUpdating(candidateId)
    try {
      // First, get the current vote count from the database to ensure accuracy
      const { data: currentData, error: fetchError } = await supabase
        .from('candidates')
        .select('votes')
        .eq('id', candidateId)
        .single()

      if (fetchError) {
        console.error('Error fetching current votes:', fetchError)
        alert('Error fetching current votes: ' + (fetchError.message || 'Unknown error'))
        return
      }

      const previousVotes = currentData.votes
      const newVotes = Math.max(0, previousVotes + change)

      // Update candidate votes
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ votes: newVotes })
        .eq('id', candidateId)

      if (updateError) {
        console.error('Error updating votes:', updateError)
        alert('Error updating votes: ' + (updateError.message || 'Unknown error'))
        return
      }

      // Log the change
      const changeType = change === 1 ? 'increment' : change === -1 ? 'decrement' : 'custom'
      const { error: logError } = await supabase
        .from('vote_changes')
        .insert({
          candidate_id: candidateId,
          previous_votes: previousVotes,
          new_votes: newVotes,
          change_amount: change,
          change_type: changeType
        })

      if (logError) {
        console.error('Error logging change:', logError)
        // Don't alert for logging errors, just console log
      }

      // Immediately refresh the candidates list
      await fetchCandidates()

    } catch (error) {
      console.error('Error:', error)
      alert('Error updating votes')
    } finally {
      setUpdating(null)
    }
  }

  const addCustomVotes = async (candidateId: number, isAdd: boolean = true) => {
    const inputValue = voteInputs[candidateId]
    if (!inputValue || inputValue.trim() === '') return

    const amount = parseInt(inputValue)
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid positive number')
      return
    }

    const change = isAdd ? amount : -amount
    await updateVotes(candidateId, change)
    setVoteInputs(prev => ({ ...prev, [candidateId]: '' }))
  }

  const handleInputChange = (candidateId: number, value: string) => {
    // Only allow positive numbers for the input field
    if (value === '' || /^\d+$/.test(value)) {
      setVoteInputs(prev => ({ ...prev, [candidateId]: value }))
    }
  }

  const addCandidate = async () => {
    if (!newCandidate.name.trim()) {
      alert('Please enter a candidate name')
      return
    }
    
    if (!newCandidate.party) {
      alert('Please select a position')
      return
    }

    setAddingCandidate(true)
    try {
      const insertData = {
        name: newCandidate.name.trim(),
        party: newCandidate.party.trim() || null,
        position: 'candidate',
        votes: 0
      }

      console.log('Attempting to add candidate with basic data:', insertData)

      // First try without description
      const { data, error } = await supabase
        .from('candidates')
        .insert(insertData)

      if (error) {
        console.error('Basic insert failed:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        alert('Error adding candidate: ' + error.message + (error.details ? ' - ' + error.details : ''))
        return
      }

      console.log('Basic candidate added successfully:', data)

      // If we have a description, try to update with it
      if (newCandidate.description.trim()) {
        console.log('Attempting to add description...')
        const { error: updateError } = await supabase
          .from('candidates')
          .update({ description: newCandidate.description.trim() })
          .eq('name', newCandidate.name.trim())

        if (updateError) {
          console.error('Description update failed (but candidate was added):', updateError)
          alert('Candidate added successfully, but description could not be saved: ' + updateError.message)
        } else {
          console.log('Description added successfully')
        }
      }

      // Reset form and refresh candidates
      setNewCandidate({ name: '', party: '', description: '' })
      setShowAddForm(false)
      await fetchCandidates()
      alert('Candidate added successfully!')
    } catch (error) {
      console.error('Catch block error:', error)
      alert('Error adding candidate: ' + (error instanceof Error ? error.message : JSON.stringify(error)))
    } finally {
      setAddingCandidate(false)
    }
  }

  const removeCandidate = async (candidateId: number, candidateName: string) => {
    if (!confirm(`Are you sure you want to remove "${candidateName}"? This action cannot be undone.`)) {
      return
    }

    setRemovingCandidate(candidateId)
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId)

      if (error) {
        console.error('Error removing candidate:', error)
        alert('Error removing candidate: ' + (error.message || 'Unknown error'))
        return
      }

      await fetchCandidates()
      alert('Candidate removed successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Error removing candidate')
    } finally {
      setRemovingCandidate(null)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    
    if (loginForm.username === 'admin' && loginForm.password === 'admin6108') {
      setIsAuthenticated(true)
      setLoginForm({ username: '', password: '' })
    } else {
      setLoginError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setLoginForm({ username: '', password: '' })
    setLoginError('')
  }

  // Group candidates by position for admin panel
  const groupedCandidates = candidates.reduce((groups, candidate) => {
    const position = candidate.party || 'Other'
    if (!groups[position]) {
      groups[position] = []
    }
    groups[position].push(candidate)
    return groups
  }, {} as Record<string, Candidate[]>)

  // Sort candidates within each position alphabetically by name for stable admin interface
  Object.keys(groupedCandidates).forEach(position => {
    groupedCandidates[position].sort((a, b) => a.name.localeCompare(b.name))
  })

  // Define position order: BOD first, then Audit Committee, then Election Committee
  const positionOrder = ['Board of Director (BOD)', 'Audit Committee', 'Election Committee']
  const adminPositions = positionOrder.filter(position => groupedCandidates[position])

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600 mt-2">Enter your credentials to access the admin panel</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                placeholder="Enter username"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                placeholder="Enter password"
                required
              />
            </div>
            
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              href="/"
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              ← Back to Results
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading candidates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Results</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Vote Administration Panel</h1>
                <p className="text-red-100 mt-1">Increment/Decrement Vote Counts</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchCandidates}
                className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Vote Management Section */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-blue-700 text-white p-6 rounded-t-lg">
            <h2 className="text-2xl font-bold">Vote Management</h2>
            <p className="text-blue-100">Adjust vote counts for existing candidates</p>
          </div>
          <div className="p-6 space-y-8">
            {adminPositions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No candidates found. Add some candidates to get started!</p>
              </div>
            ) : (
              adminPositions.map(position => (
                <div key={position} className="space-y-4">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="text-xl font-bold text-gray-900">{position}</h3>
                    <p className="text-gray-600">{groupedCandidates[position].length} candidate{groupedCandidates[position].length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="space-y-4">
                    {groupedCandidates[position].map(candidate => (
              <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{candidate.name}</h3>
                        {candidate.party && (
                          <p className="text-sm text-gray-600">Position: {candidate.party}</p>
                        )}
                        {candidate.description && (
                          <p className="text-sm text-gray-700 mt-1">{candidate.description}</p>
                        )}
                        <p className="text-2xl font-bold text-blue-600 mt-2">
                          {candidate.votes.toLocaleString()} votes
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeCandidate(candidate.id, candidate.name)}
                    disabled={removingCandidate === candidate.id}
                    className="ml-4 flex items-center space-x-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg font-semibold transition-colors"
                  >
                    {removingCandidate === candidate.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span>Remove</span>
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-3 mb-4">
                  <button
                    onClick={() => updateVotes(candidate.id, -1)}
                    disabled={updating === candidate.id}
                    className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                    <span>-1</span>
                  </button>
                  
                  <button
                    onClick={() => updateVotes(candidate.id, 1)}
                    disabled={updating === candidate.id}
                    className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+1</span>
                  </button>

                  {updating === candidate.id && (
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  )}
                </div>

                {/* Custom Amount */}
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter amount (numbers only)"
                    value={voteInputs[candidate.id] || ''}
                    onChange={(e) => handleInputChange(candidate.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomVotes(candidate.id, true)
                      }
                    }}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addCustomVotes(candidate.id, true)}
                      disabled={updating === candidate.id || !voteInputs[candidate.id]}
                      className="flex-1 flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Votes</span>
                    </button>
                    <button
                      onClick={() => addCustomVotes(candidate.id, false)}
                      disabled={updating === candidate.id || !voteInputs[candidate.id]}
                      className="flex-1 flex items-center justify-center space-x-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                      <span>Subtract Votes</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Candidate Management Section */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-green-700 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Candidate Management</h2>
                <p className="text-green-100">Add or remove candidates from the election</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-2 bg-green-800 hover:bg-green-900 px-4 py-2 rounded-lg transition-colors"
              >
                {showAddForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{showAddForm ? 'Cancel' : 'Add Candidate'}</span>
              </button>
            </div>
          </div>

          {/* Add Candidate Form */}
          {showAddForm && (
            <div className="p-6 border-b border-gray-200 bg-green-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Candidate</h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter candidate's full name"
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newCandidate.party}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, party: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    required
                  >
                    <option value="">Select a position</option>
                    {positions.map(position => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  <textarea
                    placeholder="Enter a brief description of the candidate (optional)"
                    value={newCandidate.description}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={addCandidate}
                    disabled={addingCandidate || !newCandidate.name.trim() || !newCandidate.party}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    {addingCandidate ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{addingCandidate ? 'Adding...' : 'Add Candidate'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewCandidate({ name: '', party: '', description: '' })
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Candidate List for Management */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Candidates ({candidates.length})</h3>
            {candidates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No candidates found. Add some candidates to get started!</p>
            ) : (
              <div className="space-y-6">
                {adminPositions.map(position => (
                  <div key={position}>
                    <h4 className="font-semibold text-gray-800 text-lg mb-3 border-b border-gray-200 pb-2">
                      {position} ({groupedCandidates[position].length})
                    </h4>
                    <div className="space-y-3">
                      {groupedCandidates[position].map(candidate => (
                        <div key={candidate.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h5 className="font-medium text-gray-900">{candidate.name}</h5>
                              <p className="text-sm text-blue-600">{candidate.votes.toLocaleString()} votes</p>
                              {candidate.description && (
                                <p className="text-sm text-gray-500">{candidate.description}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeCandidate(candidate.id, candidate.name)}
                            disabled={removingCandidate === candidate.id}
                            className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                          >
                            {removingCandidate === candidate.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Use the Admin Panel</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">Vote Management</h4>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li><strong>Quick Actions:</strong> Use the red (-1) and green (+1) buttons for single vote adjustments</li>
                <li><strong>Custom Amounts:</strong> Enter any positive number in the input field</li>
                <li><strong>Add Votes:</strong> Click the green &quot;Add Votes&quot; button to increase by the entered amount</li>
                <li><strong>Subtract Votes:</strong> Click the red &quot;Subtract Votes&quot; button to decrease by the entered amount</li>
                <li><strong>Keyboard Shortcut:</strong> Press Enter after typing a number to quickly add those votes</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">Candidate Management</h4>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li><strong>Add Candidate:</strong> Click &quot;Add Candidate&quot; button to open the form</li>
                <li><strong>Required Fields:</strong> Both candidate name and position are required</li>
                <li><strong>Position:</strong> Select from Board of Director (BOD), Audit Committee, or Election Committee</li>
                <li><strong>Description:</strong> Optional short description of the candidate</li>
                <li><strong>Remove Candidate:</strong> Click the red &quot;Remove&quot; button next to any candidate (requires confirmation)</li>
                <li><strong>View All:</strong> See all current candidates with their vote counts at the bottom</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">Real-time Updates</h4>
              <ul className="text-blue-700 space-y-1 text-sm">
                <li><strong>Live Sync:</strong> All changes are applied immediately and updated across all devices</li>
                <li><strong>Main Page:</strong> Results automatically refresh to show the latest vote counts</li>
                <li><strong>Admin Panel:</strong> Real-time updates ensure you&apos;re always working with current data</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 