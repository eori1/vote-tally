'use client'

import { Candidate } from '@/types'
import { Users } from 'lucide-react'

interface VoteCardProps {
  candidate: Candidate
  rank: number
  totalVotes: number
}

export default function VoteCard({ candidate, rank, totalVotes }: VoteCardProps) {
  const percentage = totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(2) : '0.00'
  
  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st'
    if (rank === 2) return 'nd'
    if (rank === 3) return 'rd'
    return 'th'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="bg-gray-100 rounded-full p-1">
            <Users className="w-3 h-3 text-gray-600" />
          </div>
          <span className="text-sm font-bold text-gray-800">
            {rank}{getRankSuffix(rank)}
          </span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">
            {percentage}%
          </div>
        </div>
      </div>
      
      <div className="mb-2">
        <h3 className="text-base font-bold text-gray-900 uppercase leading-tight">
          {candidate.name}
        </h3>
        {candidate.party && (
          <p className="text-xs text-gray-600 mt-0.5">({candidate.party})</p>
        )}
      </div>
      
      <div className="mb-2">
        <div className="text-xl font-bold text-blue-800">
          {candidate.votes.toLocaleString()}
        </div>
        <div className="text-xs text-gray-600">Votes</div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${Math.min(parseFloat(percentage), 100)}%` }}
        ></div>
      </div>
    </div>
  )
} 