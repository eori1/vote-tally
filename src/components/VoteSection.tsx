'use client'

import { Candidate } from '@/types'
import VoteCard from './VoteCard'
import { Users } from 'lucide-react'

interface VoteSectionProps {
  title: string
  candidates: Candidate[]
}

export default function VoteSection({ title, candidates }: VoteSectionProps) {
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes)
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
    return <Users className="w-8 h-8 text-white" />
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`${getSectionColor(title)} text-white p-6 rounded-t-lg`}>
        <div className="flex items-center space-x-4">
          {getSectionIcon()}
          <div>
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="text-lg opacity-90">ORGANIZATIONAL ELECTION</p>
            <p className="text-sm opacity-75 mt-1">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} running</p>
          </div>
        </div>
      </div>

      {/* Vote Cards */}
      <div className="bg-gray-50 p-6 rounded-b-lg">
        <div className="grid gap-6">
          {sortedCandidates.map((candidate, index) => (
            <VoteCard 
              key={candidate.id}
              candidate={candidate}
              rank={index + 1}
              totalVotes={totalVotes}
            />
          ))}
        </div>
      </div>
    </div>
  )
} 