'use client';

import { useState } from 'react';

interface Review {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  orderNumber?: string;
  verified: boolean;
  helpful: number;
  response?: {
    text: string;
    date: string;
    author: string;
  };
  category: 'food' | 'service' | 'ambiance' | 'delivery' | 'overall';
  status: 'pending' | 'approved' | 'flagged' | 'hidden';
  images?: string[];
}

export default function CustomerReviews() {
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  const reviews: Review[] = [
    {
      id: 'review_001',
      customerName: 'Priya Sharma',
      customerAvatar: '👩‍💼',
      rating: 5,
      title: 'Outstanding food and service!',
      comment: 'Had an amazing dinner here last night. The butter chicken was incredible, and the service was top-notch. Our waiter was very attentive and made great recommendations. The ambiance is perfect for a date night. Will definitely come back!',
      date: '2025-01-15 20:30:00',
      orderNumber: 'ORD-2025-0123',
      verified: true,
      helpful: 12,
      category: 'overall',
      status: 'approved',
      response: {
        text: 'Thank you so much for your wonderful review, Priya! We\'re thrilled you enjoyed our butter chicken and the overall experience. We look forward to welcoming you back soon!',
        date: '2025-01-16 09:15:00',
        author: 'Restaurant Manager'
      }
    },
    {
      id: 'review_002',
      customerName: 'Rajesh Kumar',
      customerAvatar: '👨‍💻',
      rating: 4,
      title: 'Great food, slow service',
      comment: 'The food quality is excellent and authentic. Loved the biryani and dal makhani. However, the service was quite slow. We had to wait 45 minutes for our order. The staff was friendly but seemed overwhelmed.',
      date: '2025-01-14 19:45:00',
      orderNumber: 'ORD-2025-0089',
      verified: true,
      helpful: 8,
      category: 'service',
      status: 'pending',
      images: ['/api/placeholder/200/200']
    },
    {
      id: 'review_003',
      customerName: 'Neha Patel',
      customerAvatar: '👩‍🎓',
      rating: 2,
      title: 'Disappointed with delivery experience',
      comment: 'Ordered through delivery. Food arrived cold and almost an hour late. The packaging was poor and some curry spilled. Called the restaurant but didn\'t get satisfactory response. Expected better from a highly rated place.',
      date: '2025-01-13 21:15:00',
      orderNumber: 'ORD-2025-0067',
      verified: true,
      helpful: 15,
      category: 'delivery',
      status: 'flagged'
    },
    {
      id: 'review_004',
      customerName: 'Amit Singh',
      customerAvatar: '👨‍🍳',
      rating: 5,
      title: 'Perfect for celebrations',
      comment: 'Celebrated my anniversary here and it was perfect! The staff decorated our table beautifully. Every dish was flavorful and well-presented. Special mention to the chef for accommodating my wife\'s dietary restrictions. Highly recommend!',
      date: '2025-01-12 20:00:00',
      orderNumber: 'ORD-2025-0045',
      verified: true,
      helpful: 9,
      category: 'overall',
      status: 'approved',
      response: {
        text: 'Congratulations on your anniversary, Amit! We\'re so happy we could make your celebration special. Thank you for choosing us for such an important occasion.',
        date: '2025-01-13 10:30:00',
        author: 'Head Chef'
      }
    },
    {
      id: 'review_005',
      customerName: 'Sunita Verma',
      customerAvatar: '👵',
      rating: 3,
      title: 'Average experience',
      comment: 'The food was okay but nothing special. Prices are a bit high for the portion size. The restaurant atmosphere is nice but can get quite noisy during peak hours. Service was prompt though.',
      date: '2025-01-11 18:30:00',
      verified: false,
      helpful: 5,
      category: 'food',
      status: 'approved'
    },
    {
      id: 'review_006',
      customerName: 'Vikash Agarwal',
      customerAvatar: '👨‍🏫',
      rating: 1,
      title: 'Terrible experience - avoid!',
      comment: 'Worst dining experience ever. Food was bland and seemed reheated. Found hair in my curry. When complained, staff was rude and dismissive. Manager was not available. Will never come back and will warn others.',
      date: '2025-01-10 19:45:00',
      verified: true,
      helpful: 23,
      category: 'food',
      status: 'flagged'
    },
    {
      id: 'review_007',
      customerName: 'Meera Reddy',
      customerAvatar: '👩‍⚕️',
      rating: 4,
      title: 'Love the ambiance',
      comment: 'Beautiful interiors and great atmosphere. Perfect for business meetings. Food is good, especially the vegetarian options. Staff is professional and courteous. Only complaint is limited parking space.',
      date: '2025-01-09 20:15:00',
      orderNumber: 'ORD-2025-0034',
      verified: true,
      helpful: 6,
      category: 'ambiance',
      status: 'approved'
    }
  ];

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      case 'hidden': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'service': return '👨‍💼';
      case 'ambiance': return '🏮';
      case 'delivery': return '🚗';
      case 'overall': return '⭐';
      default: return '📝';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  const filteredReviews = reviews.filter(review => {
    const matchesRating = selectedRating === 'all' || review.rating.toString() === selectedRating;
    const matchesCategory = selectedCategory === 'all' || review.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || review.status === selectedStatus;
    const matchesSearch = searchTerm === '' ||
      review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRating && matchesCategory && matchesStatus && matchesSearch;
  });

  const reviewStats = {
    totalReviews: reviews.length,
    averageRating: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
    ratingDistribution: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    },
    pendingReviews: reviews.filter(r => r.status === 'pending').length,
    flaggedReviews: reviews.filter(r => r.status === 'flagged').length
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    
    setIsResponding(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info(`Responding to review ${reviewId}: ${responseText}`);
    setResponseText('');
    setIsResponding(false);
    setSelectedReview(null);
  };

  const updateReviewStatus = (reviewId: string, newStatus: Review['status']) => {
    logger.info(`Updating review ${reviewId} to status: ${newStatus}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="mt-2 text-gray-600">Manage customer feedback and maintain your reputation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-lg font-semibold text-gray-900">{reviewStats.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">⭐</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <div className="flex items-center">
                  <p className="text-lg font-semibold text-gray-900">{reviewStats.averageRating.toFixed(1)}</p>
                  <div className="ml-2 flex">
                    {renderStars(Math.round(reviewStats.averageRating))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-lg font-semibold text-gray-900">{reviewStats.pendingReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-red-600 text-xl">🚩</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Flagged Reviews</p>
                <p className="text-lg font-semibold text-gray-900">{reviewStats.flaggedReviews}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <select 
              value={selectedRating} 
              onChange={(e) => setSelectedRating(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="food">Food</option>
              <option value="service">Service</option>
              <option value="ambiance">Ambiance</option>
              <option value="delivery">Delivery</option>
              <option value="overall">Overall</option>
            </select>

            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rating Distribution</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => (
                <div key={rating} className="flex items-center">
                  <span className="text-sm text-gray-600 w-8">{rating}⭐</span>
                  <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution] / reviewStats.totalReviews) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="text-sm text-green-800">New 5-star review from Priya Sharma</span>
                <span className="text-xs text-green-600">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                <span className="text-sm text-yellow-800">Review flagged for inappropriate content</span>
                <span className="text-xs text-yellow-600">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <span className="text-sm text-blue-800">You responded to Amit Singh's review</span>
                <span className="text-xs text-blue-600">1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                      {review.customerAvatar || '👤'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{review.customerName}</h3>
                        {review.verified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString('en-IN')}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <div className="flex items-center">
                          <span className="mr-1">{getCategoryIcon(review.category)}</span>
                          <span className="text-sm text-gray-500 capitalize">{review.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                </div>

                {review.images && review.images.length > 0 && (
                  <div className="mb-4 flex space-x-2">
                    {review.images.map((image, index) => (
                      <div key={index} className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500 text-xs">📷</span>
                      </div>
                    ))}
                  </div>
                )}

                {review.response && (
                  <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">Response from {review.response.author}</span>
                      <span className="text-xs text-blue-600">
                        {new Date(review.response.date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">{review.response.text}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {review.orderNumber && (
                      <span>Order: {review.orderNumber}</span>
                    )}
                    <span>{review.helpful} found helpful</span>
                  </div>
                  <div className="flex space-x-2">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'approved')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'flagged')}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Flag
                        </button>
                      </>
                    )}
                    {review.status === 'flagged' && (
                      <>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'approved')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateReviewStatus(review.id, 'hidden')}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Hide
                        </button>
                      </>
                    )}
                    {!review.response && (
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Respond
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex space-x-1">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Previous</button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">Next</button>
          </div>
        </div>

        {selectedReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedReview.response ? 'Review Details' : 'Respond to Review'}
                </h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-6 py-4">
                <div className="mb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {selectedReview.customerAvatar || '👤'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedReview.customerName}</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex">{renderStars(selectedReview.rating)}</div>
                        <span className="text-sm text-gray-500">
                          {new Date(selectedReview.date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <h5 className="font-medium text-gray-900 mb-2">{selectedReview.title}</h5>
                  <p className="text-gray-700">{selectedReview.comment}</p>
                </div>

                {selectedReview.response && (
                  <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">Your Response</span>
                      <span className="text-xs text-blue-600">
                        {new Date(selectedReview.response.date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">{selectedReview.response.text}</p>
                  </div>
                )}

                {!selectedReview.response && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Your Response</label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Write a professional response to this review..."
                    />
                    <div className="text-sm text-gray-500">
                      Tip: Be professional, acknowledge the feedback, and offer solutions when appropriate.
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
                {!selectedReview.response && (
                  <button
                    onClick={() => handleRespond(selectedReview.id)}
                    disabled={!responseText.trim() || isResponding}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isResponding ? 'Posting...' : 'Post Response'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}