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
  
  const getSectionColor = () => {
    return 'bg-blue-700' // Single color for all candidates
  }

  const getSectionIcon = () => {
    return <Users className="w-8 h-8 text-white" />
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className={`${getSectionColor()} text-white p-6 rounded-t-lg`}>
        <div className="flex items-center space-x-4">
          {getSectionIcon()}
          <div>
            <h2 className="text-3xl font-bold">{title}</h2>
            <p className="text-lg opacity-90">PHILIPPINES</p>
          </div>
          <div className="ml-auto flex space-x-4">
            <a href="#" className="text-white hover:text-blue-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
            <a href="#" className="text-white hover:text-blue-200">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
              </svg>
            </a>
          </div>
        </div>
        <div className="mt-4 text-sm opacity-75">
          Partial, unofficial results aggregated from Comelec data as of May 15, 2025, 2:41 PM and from 99.12% of Election Returns
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