export interface Candidate {
  id: number
  name: string
  party: string | null
  position: 'candidate'
  votes: number
  description?: string | null
  created_at: string
}

export interface VoteUpdate {
  candidateId: number
  votes: number
} 