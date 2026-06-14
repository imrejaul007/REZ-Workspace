import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * CACHE FIX: On-demand revalidation utilities
 *
 * Previously static pages never updated until redeployment.
 * Now data changes trigger automatic cache invalidation.
 *
 * Usage:
 * - Call revalidateListing(slug) after creating/updating listings
 * - Call revalidateBooking(id) after booking state changes
 * - Call revalidateUser(userId) after profile updates
 */

export const CACHE_TAGS = {
  LISTINGS: 'listings',
  LISTING: (slug: string) => `listing-${slug}`,
  BOOKINGS: 'bookings',
  BOOKING: (id: string) => `booking-${id}`,
  USER: (id: string) => `user-${id}`,
  CAMPAIGNS: 'campaigns',
  CAMPAIGN: (id: string) => `campaign-${id}`,
  LISTING_REVIEWS: (listingId: string) => `listing-reviews-${listingId}`,
} as const

/**
 * Revalidate listing-related caches after CRUD operations
 */
export function revalidateListing(slug: string): void {
  // Revalidate specific listing page
  revalidatePath(`/listing/${slug}`)

  // Revalidate listings list
  revalidatePath('/browse')
  revalidatePath('/vendor/listings')

  // Revalidate by tag for fetch queries
  revalidateTag(CACHE_TAGS.LISTINGS, 'max')
  revalidateTag(CACHE_TAGS.LISTING(slug), 'max')
}

/**
 * Revalidate booking-related caches after state changes
 */
export function revalidateBooking(bookingId: string): void {
  // Revalidate specific booking page
  revalidatePath(`/buyer/bookings`)

  // Revalidate buyer's bookings list
  revalidateTag(CACHE_TAGS.BOOKINGS, 'max')
  revalidateTag(CACHE_TAGS.BOOKING(bookingId), 'max')
}

/**
 * Revalidate user-related caches after profile updates
 */
export function revalidateUser(userId: string): void {
  // Revalidate user profile
  revalidatePath(`/buyer/profile`)
  revalidatePath(`/admin/users`)

  // Revalidate by tag
  revalidateTag(CACHE_TAGS.USER(userId), 'max')
}

/**
 * Revalidate campaign caches
 */
export function revalidateCampaign(campaignId: string): void {
  // Revalidate campaign pages
  revalidatePath(`/buyer/campaigns`)

  // Revalidate by tag
  revalidateTag(CACHE_TAGS.CAMPAIGNS, 'max')
  revalidateTag(CACHE_TAGS.CAMPAIGN(campaignId), 'max')
}

/**
 * Revalidate listing reviews
 */
export function revalidateListingReviews(listingId: string): void {
  revalidateTag(CACHE_TAGS.LISTING_REVIEWS(listingId), 'max')
}

/**
 * Helper to revalidate multiple related paths after a transaction
 */
export function revalidateAfterTransaction(data: {
  type: 'listing' | 'booking' | 'campaign' | 'user'
  id: string
  slug?: string
}): void {
  switch (data.type) {
    case 'listing':
      if (data.slug) {
        revalidateListing(data.slug)
      }
      break
    case 'booking':
      revalidateBooking(data.id)
      break
    case 'campaign':
      revalidateCampaign(data.id)
      break
    case 'user':
      revalidateUser(data.id)
      break
  }
}
