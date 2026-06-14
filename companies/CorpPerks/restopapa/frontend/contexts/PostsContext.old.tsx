'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { postsStorage } from '@/utils/storage'
import { validatePostContent, sanitizeHtml, RateLimiter } from '@/utils/validation'

interface User {
  name: string
  avatar: string
  type: string
  verified: boolean
  location: string
}

interface JobDetails {
  title: string
  salary: string
  type: string
  experience: string
  location: string
  description: string
}

export interface Post {
  id: number
  user: User
  content: string
  images?: string[]
  time: string
  likes: number
  comments: number
  shares: number
  isLiked: boolean
  category: string
  tags: string[]
  postType?: string
  jobDetails?: JobDetails
}

interface PostsContextType {
  posts: Post[]
  addPost: (post: Omit<Post, 'id'>) => Promise<{ success: boolean; error?: string }>
  updatePost: (id: number, updates: Partial<Post>) => Promise<{ success: boolean; error?: string }>
  deletePost: (id: number) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
  error: string | null
}

const PostsContext = createContext<PostsContextType | undefined>(undefined)

// Initial mock data
const initialPosts: Post[] = [
  {
    id: 1,
    user: { 
      name: 'Ocean View Diner', 
      avatar: '🍽️', 
      type: 'Restaurant',
      verified: true,
      location: 'Miami Beach, FL' 
    },
    content: 'Just launched our new weekend brunch menu! Looking for experienced brunch cooks to join our team. We focus on farm-to-table ingredients and creative presentation. Any recommendations from the community?',
    images: ['/api/placeholder/400/300'],
    time: '2 hours ago',
    likes: 24,
    comments: 8,
    shares: 3,
    isLiked: false,
    category: 'Job Inquiry',
    tags: ['hiring', 'brunch', 'chef']
  },
  {
    id: 2,
    user: { 
      name: 'Chef Maria Santos', 
      avatar: '👩‍🍳', 
      type: 'Employee',
      verified: true,
      location: 'Miami, FL'
    },
    content: 'Sharing my experience working with Fresh Farm Supplies - excellent quality produce and reliable delivery. Their organic tomatoes are perfect for our pasta sauces. Highly recommend for any restaurant looking for fresh ingredients!',
    images: [],
    time: '4 hours ago',
    likes: 18,
    comments: 12,
    shares: 6,
    isLiked: true,
    category: 'Vendor Review',
    tags: ['vendor', 'fresh-produce', 'recommendation']
  },
  {
    id: 3,
    user: { 
      name: 'Ocean Grill Restaurant', 
      avatar: '🦞', 
      type: 'Restaurant',
      verified: true,
      location: 'Boston, MA'
    },
    postType: 'job',
    jobDetails: {
      title: 'Senior Sous Chef',
      salary: '$65,000 - $75,000',
      type: 'Full-time',
      experience: '3+ years',
      location: 'Boston, MA',
      description: 'We are looking for an experienced Sous Chef to join our award-winning seafood restaurant. Must have experience with fresh seafood preparation and high-volume kitchen operations.'
    },
    content: '🔥 We\'re hiring! Join our award-winning team at Ocean Grill. Looking for a passionate Sous Chef who loves working with the freshest seafood. Great benefits and opportunity for growth!',
    images: ['/api/placeholder/400/250'],
    time: '6 hours ago',
    likes: 32,
    comments: 18,
    shares: 12,
    isLiked: false,
    category: 'Job Posting',
    tags: ['hiring', 'sous-chef', 'seafood', 'full-time']
  }
]

// Rate limiter instances
const postRateLimiter = new RateLimiter(3, 60000) // 3 posts per minute
const updateRateLimiter = new RateLimiter(10, 60000) // 10 updates per minute

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize posts from secure storage
  useEffect(() => {
    const initializePosts = () => {
      setIsLoading(true)
      setError(null)
      
      const { data, error: storageError } = postsStorage.getItem<Post[]>()
      
      if (storageError) {
        logger.error('Storage initialization error:', storageError)
        setError('Failed to load posts from storage')
        setPosts(initialPosts)
      } else {
        const loadedPosts = data || initialPosts
        // Clean up old posts
        const cleanedPosts = postsStorage.cleanup(loadedPosts, 500, 7 * 24 * 60 * 60 * 1000) // 7 days
        setPosts(cleanedPosts)
        
        // Save cleaned posts back to storage
        if (cleanedPosts.length !== loadedPosts.length) {
          postsStorage.setItem(cleanedPosts)
        }
      }
      
      setIsLoading(false)
    }

    initializePosts()
  }, [])

  // Listen for localStorage changes (for cross-tab/page communication)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'community_posts' && event.newValue) {
        try {
          const newPosts = JSON.parse(event.newValue)
          setPosts(newPosts)
        } catch (error) {
          logger.error('Failed to parse posts from storage event:', error)
        }
      }
    }

    // Also listen for a custom event for same-tab updates
    const handleCustomPostUpdate = () => {
      if (typeof window !== 'undefined') {
        try {
          const savedPosts = localStorage.getItem('community_posts')
          if (savedPosts) {
            setPosts(JSON.parse(savedPosts))
          }
        } catch (error) {
          logger.error('Failed to reload posts from localStorage:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('postsUpdated', handleCustomPostUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('postsUpdated', handleCustomPostUpdate)
    }
  }, [])

  // Save posts to localStorage whenever posts change
  const savePosts = (newPosts: Post[]) => {
    setPosts(newPosts)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('community_posts', JSON.stringify(newPosts))
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('postsUpdated'))
      } catch (error) {
        logger.error('Failed to save posts to localStorage:', error)
      }
    }
  }

  const addPost = (newPost: Omit<Post, 'id'>) => {
    const post: Post = {
      ...newPost,
      id: Math.max(...posts.map(p => p.id), 0) + 1
    }
    const updatedPosts = [post, ...posts]
    savePosts(updatedPosts)
  }

  const updatePost = (id: number, updates: Partial<Post>) => {
    const updatedPosts = posts.map(post => 
      post.id === id ? { ...post, ...updates } : post
    )
    savePosts(updatedPosts)
  }

  const deletePost = (id: number) => {
    const updatedPosts = posts.filter(post => post.id !== id)
    savePosts(updatedPosts)
  }

  return (
    <PostsContext.Provider value={{ posts, addPost, updatePost, deletePost }}>
      {children}
    </PostsContext.Provider>
  )
}

export function usePosts() {
  const context = useContext(PostsContext)
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider')
  }
  return context
}