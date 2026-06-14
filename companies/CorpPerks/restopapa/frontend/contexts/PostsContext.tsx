'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { postsStorage } from '@/utils/storage'
import { validatePostContent, sanitizeHtml, RateLimiter, validateImageFile } from '@/utils/validation'
import { useToast } from '@/components/ui/Toast'

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
  clearError: () => void
}

const PostsContext = createContext<PostsContextType | undefined>(undefined)

// Initial mock data - sanitized
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
    content: sanitizeHtml('Just launched our new weekend brunch menu! Looking for experienced brunch cooks to join our team. We focus on farm-to-table ingredients and creative presentation. Any recommendations from the community?'),
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
    content: sanitizeHtml('Sharing my experience working with Fresh Farm Supplies - excellent quality produce and reliable delivery. Their organic tomatoes are perfect for our pasta sauces. Highly recommend for any restaurant looking for fresh ingredients!'),
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
      description: sanitizeHtml('We are looking for an experienced Sous Chef to join our award-winning seafood restaurant. Must have experience with fresh seafood preparation and high-volume kitchen operations.')
    },
    content: sanitizeHtml('🔥 We\'re hiring! Join our award-winning team at Ocean Grill. Looking for a passionate Sous Chef who loves working with the freshest seafood. Great benefits and opportunity for growth!'),
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
  const { showToast } = useToast()
  
  // Refs for cleanup
  const storageListenerRef = useRef<((event: StorageEvent) => void) | null>(null)
  const customListenerRef = useRef<(() => void) | null>(null)

  // Initialize posts from secure storage
  useEffect(() => {
    const initializePosts = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { data, error: storageError } = postsStorage.getItem<Post[]>()
        
        if (storageError) {
          logger.error('Storage initialization error:', storageError)
          setError('Failed to load posts from storage')
          showToast({
            type: 'warning',
            title: 'Storage Warning',
            message: 'Using default posts due to storage issues'
          })
          setPosts(initialPosts)
        } else {
          const loadedPosts = data || initialPosts
          // Clean up old posts and validate structure
          const validPosts = loadedPosts.filter(post => 
            post && 
            typeof post.id === 'number' && 
            post.user && 
            typeof post.content === 'string'
          )
          const cleanedPosts = postsStorage.cleanup(validPosts, 500, 7 * 24 * 60 * 60 * 1000) // 7 days
          setPosts(cleanedPosts)
          
          // Save cleaned posts back to storage if changed
          if (cleanedPosts.length !== loadedPosts.length) {
            const saveResult = await postsStorage.setItem(cleanedPosts)
            if (!saveResult.success && saveResult.error) {
              logger.error('Failed to save cleaned posts:', saveResult.error)
            }
          }
        }
      } catch (err) {
        logger.error('Unexpected error during posts initialization:', err)
        setError('Unexpected error loading posts')
        setPosts(initialPosts)
      }
      
      setIsLoading(false)
    }

    initializePosts()
  }, [showToast])

  // Listen for storage changes with proper cleanup
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'community_posts' && event.newValue) {
        try {
          const newPosts = JSON.parse(event.newValue)
          if (Array.isArray(newPosts)) {
            setPosts(newPosts)
          }
        } catch (error) {
          logger.error('Failed to parse posts from storage event:', error)
          showToast({
            type: 'error',
            title: 'Sync Error',
            message: 'Failed to sync posts from other tabs'
          })
        }
      }
    }

    const handleCustomPostUpdate = () => {
      try {
        const { data } = postsStorage.getItem<Post[]>()
        if (data && Array.isArray(data)) {
          setPosts(data)
        }
      } catch (error) {
        logger.error('Failed to reload posts from localStorage:', error)
      }
    }

    storageListenerRef.current = handleStorageChange
    customListenerRef.current = handleCustomPostUpdate

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('postsUpdated', handleCustomPostUpdate)

    return () => {
      if (storageListenerRef.current) {
        window.removeEventListener('storage', storageListenerRef.current)
      }
      if (customListenerRef.current) {
        window.removeEventListener('postsUpdated', customListenerRef.current)
      }
    }
  }, [showToast])

  // Save posts with error handling
  const savePosts = async (newPosts: Post[]): Promise<{ success: boolean; error?: string }> => {
    const result = await postsStorage.setItem(newPosts)
    if (result.success) {
      setPosts(newPosts)
      // Dispatch custom event for same-tab updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('postsUpdated'))
      }
    } else {
      logger.error('Failed to save posts:', result.error)
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: result.error?.message || 'Failed to save posts'
      })
    }
    return result
  }

  const addPost = async (newPost: Omit<Post, 'id'>): Promise<{ success: boolean; error?: string }> => {
    // Rate limiting
    const userId = `${newPost.user.type}-${newPost.user.name}`
    if (!postRateLimiter.isAllowed(userId)) {
      const waitTime = Math.ceil(postRateLimiter.getRemainingTime(userId) / 1000)
      const errorMsg = `Rate limit exceeded. Please wait ${waitTime} seconds before posting again.`
      showToast({
        type: 'warning',
        title: 'Rate Limited',
        message: errorMsg
      })
      return { success: false, error: errorMsg }
    }

    // Validate content
    const contentErrors = validatePostContent(newPost.content)
    if (contentErrors.length > 0) {
      const errorMsg = contentErrors[0].message
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: errorMsg
      })
      return { success: false, error: errorMsg }
    }

    // Validate images if present
    if (newPost.images && newPost.images.length > 0) {
      for (const imageUrl of newPost.images) {
        if (imageUrl.startsWith('blob:')) {
          // This is a client-side blob URL, we'd need to validate the original file
          // For now, just check if it's a reasonable size
          try {
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const imageErrors = validateImageFile(new File([blob], 'image'))
            if (imageErrors.length > 0) {
              const errorMsg = imageErrors[0].message
              showToast({
                type: 'error',
                title: 'Image Validation Error',
                message: errorMsg
              })
              return { success: false, error: errorMsg }
            }
          } catch (err) {
            logger.error('Failed to validate image:', err)
          }
        }
      }
    }

    try {
      // Sanitize content
      const sanitizedPost: Post = {
        ...newPost,
        id: Math.max(...posts.map(p => p.id), 0) + 1,
        content: sanitizeHtml(newPost.content),
        user: {
          ...newPost.user,
          name: sanitizeHtml(newPost.user.name),
          location: sanitizeHtml(newPost.user.location)
        },
        tags: newPost.tags.map(tag => sanitizeHtml(tag)),
        jobDetails: newPost.jobDetails ? {
          ...newPost.jobDetails,
          title: sanitizeHtml(newPost.jobDetails.title),
          description: sanitizeHtml(newPost.jobDetails.description),
          location: sanitizeHtml(newPost.jobDetails.location)
        } : undefined
      }

      const updatedPosts = [sanitizedPost, ...posts]
      const result = await savePosts(updatedPosts)
      
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Post Created',
          message: 'Your post has been shared with the community!'
        })
      }
      
      return result
    } catch (err) {
      const errorMsg = 'Failed to create post due to unexpected error'
      logger.error('Add post error:', err)
      showToast({
        type: 'error',
        title: 'Post Failed',
        message: errorMsg
      })
      return { success: false, error: errorMsg }
    }
  }

  const updatePost = async (id: number, updates: Partial<Post>): Promise<{ success: boolean; error?: string }> => {
    // Rate limiting
    if (!updateRateLimiter.isAllowed(`update-${id}`)) {
      const errorMsg = 'Too many updates. Please wait before trying again.'
      showToast({
        type: 'warning',
        title: 'Rate Limited',
        message: errorMsg
      })
      return { success: false, error: errorMsg }
    }

    try {
      const updatedPosts = posts.map(post => 
        post.id === id ? { ...post, ...updates } : post
      )
      
      const result = await savePosts(updatedPosts)
      return result
    } catch (err) {
      const errorMsg = 'Failed to update post'
      logger.error('Update post error:', err)
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMsg
      })
      return { success: false, error: errorMsg }
    }
  }

  const deletePost = async (id: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedPosts = posts.filter(post => post.id !== id)
      const result = await savePosts(updatedPosts)
      
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Post Deleted',
          message: 'Post has been removed from the feed'
        })
      }
      
      return result
    } catch (err) {
      const errorMsg = 'Failed to delete post'
      logger.error('Delete post error:', err)
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: errorMsg
      })
      return { success: false, error: errorMsg }
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <PostsContext.Provider value={{ 
      posts, 
      addPost, 
      updatePost, 
      deletePost, 
      isLoading, 
      error,
      clearError
    }}>
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