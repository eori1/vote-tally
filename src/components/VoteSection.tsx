'use client'

import { Candidate } from '@/types'
import VoteCard from './VoteCard'
import { Users } from 'lucide-react'

interface VoteSectionProps {
  title: string
  candidates: Candidate[]
  showAll?: boolean
}

export default function VoteSection({ title, candidates, showAll = false }: VoteSectionProps) {
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes)
  const displayedCandidates = showAll ? sortedCandidates : sortedCandidates.slice(0, 4)
  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.votes, 0)
  
  const getSectionColor = (title: string) => {
    // Different colors for the three positions
    const colorMap: Record<string, string> = {
      'Board of Director (BOD)': 'bg-blue-700',
      'Audit Committee': 'bg-green-700', 
      'Election Committee': 'bg-purple-700'
    }
    return colorMap[title] || 'bg-gray-700'
  }

  const getSectionIcon = () => {
    return <Users className="w-6 h-6 text-white" />
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`${getSectionColor(title)} text-white p-3 rounded-t-lg`}>
        <div className="flex items-center space-x-2">
          {getSectionIcon()}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">{title}</h2>
            <p className="text-sm opacity-90">ORGANIZATIONAL ELECTION</p>
            <p className="text-xs opacity-75 mt-0.5">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} running</p>
          </div>
        </div>
      </div>

      {/* Vote Cards */}
      <div className="bg-gray-50 p-3 rounded-b-lg">
        <div className="grid gap-3">
          {displayedCandidates.map((candidate) => (
            <VoteCard 
              key={candidate.id}
              candidate={candidate}
              rank={sortedCandidates.findIndex(c => c.id === candidate.id) + 1}
              totalVotes={totalVotes}
            />
          ))}
          {!showAll && sortedCandidates.length > 4 && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500">
                {sortedCandidates.length - 4} more candidate{sortedCandidates.length - 4 !== 1 ? 's' : ''} not shown
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 