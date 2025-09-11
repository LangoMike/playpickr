import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

interface InteractionState {
  liked: boolean
  favorited: boolean
  played: boolean
  loading: boolean
}

export function useInteractions(gameId: string) {
  const { user } = useAuth()
  const [state, setState] = useState<InteractionState>({
    liked: false,
    favorited: false,
    played: false,
    loading: true
  })

  // fetch current interaction state
  useEffect(() => {
    if (!user || !gameId) {
      setState(prev => ({ ...prev, loading: false }))
      return
    }

    const fetchInteractions = async () => {
      try {
        const response = await fetch(`/api/interactions?gameId=${gameId}`)
        const result = await response.json()
        
        if (result.success) {
          setState({
            liked: result.data.liked,
            favorited: result.data.favorited,
            played: result.data.played,
            loading: false
          })
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('Error fetching interactions:', error)
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    fetchInteractions()
  }, [user, gameId])

  // toggle interaction
  const toggleInteraction = async (action: 'like' | 'favorite' | 'played') => {
    if (!user) {
      alert('Please sign in to interact with games')
      return
    }

    setState(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          action
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setState(prev => ({
          ...prev,
          [action === 'favorite' ? 'favorited' : action]: result.action === 'added',
          loading: false
        }))
      } else {
        console.error('Error toggling interaction:', result.error)
        setState(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Error toggling interaction:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  return {
    ...state,
    toggleLike: () => toggleInteraction('like'),
    toggleFavorite: () => toggleInteraction('favorite'),
    togglePlayed: () => toggleInteraction('played')
  }
}
