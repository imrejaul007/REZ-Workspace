# RestoPapa API Client

A comprehensive TypeScript/JavaScript client library for integrating with the RestoPapa API. This client provides both REST API and WebSocket connectivity with built-in authentication, error handling, retries, and framework-specific helpers.

## Features

- 🔐 **Automatic Authentication** - JWT token management with automatic refresh
- 🔄 **Smart Retries** - Configurable retry logic for failed requests
- 📡 **Real-time Updates** - WebSocket client for live order tracking and notifications
- ⚛️ **React Hooks** - Ready-to-use React hooks for common operations
- 🟢 **Vue Composables** - Vue 3 Composition API support
- 📝 **Full TypeScript Support** - Complete type definitions for all API responses
- 🎯 **Framework Agnostic** - Works with any JavaScript framework or vanilla JS
- ⚡ **Performance Optimized** - Built-in caching and request deduplication

## Installation

```bash
npm install @restopapa/api-client
# or
yarn add @restopapa/api-client
```

## Quick Start

### Basic Setup

```typescript
import { createApiClient, createSocketClient } from '@restopapa/api-client';

// Initialize API client
const apiClient = createApiClient({
  baseURL: 'https://api.restopapa.com',
  apiKey: 'your-api-key', // Optional for public endpoints
});

// Initialize Socket client (optional)
const socketClient = createSocketClient({
  baseURL: 'https://api.restopapa.com',
});
```

### Authentication

```typescript
// Sign up new user
const { user, tokens } = await apiClient.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  firstName: 'John',
  lastName: 'Doe',
  role: 'CUSTOMER'
});

// Sign in existing user
const { user, tokens } = await apiClient.signIn({
  email: 'user@example.com',
  password: 'securepassword'
});

// Update socket authentication
socketClient.updateAuth(tokens.accessToken);
```

### Basic API Usage

```typescript
// Get restaurants with search and filters
const restaurants = await apiClient.getRestaurants({
  q: 'pizza',
  page: 1,
  limit: 10,
  filters: {
    cuisine: ['Italian'],
    priceRange: { min: 10, max: 50 }
  }
});

// Create a new order
const order = await apiClient.createOrder({
  restaurantId: 'rest-123',
  items: [
    {
      menuItemId: 'item-456',
      quantity: 2,
      selectedAddons: []
    }
  ],
  deliveryAddress: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    zipCode: '10001'
  }
});

// Upload a file
const fileUpload = await apiClient.uploadFile(file, {
  category: 'profile-images',
  isPublic: true,
  maxWidth: 800,
  maxHeight: 600
});
```

### Real-time Features

```typescript
// Connect to WebSocket
await socketClient.connect();

// Subscribe to order updates
socketClient.subscribeToOrderUpdates('order-123');

// Listen for real-time events
socketClient.on('orderUpdate', (update) => {
  console.log(`Order ${update.orderId} status: ${update.status}`);
});

// Send a message
socketClient.sendMessage({
  recipientId: 'user-456',
  content: 'Hello!',
  type: 'TEXT'
});

// Subscribe to notifications
socketClient.subscribeToNotifications();
socketClient.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

## React Integration

### Setup with React

```typescript
import { useApiClient, useAuth, useOrders } from '@restopapa/api-client';

function App() {
  const { initializeClient } = useApiClient();
  
  useEffect(() => {
    initializeClient({
      baseURL: 'https://api.restopapa.com',
    });
  }, []);

  return <RestaurantApp />;
}
```

### Authentication Hook

```typescript
import { useAuth } from '@restopapa/api-client';

function LoginForm() {
  const { signIn, signUp, user, loading, error } = useAuth();
  const { client } = useApiClient();

  const handleSignIn = async (credentials) => {
    try {
      await signIn(client, credentials);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <div>
      {user ? (
        <p>Welcome, {user.firstName}!</p>
      ) : (
        <LoginFormComponent onSubmit={handleSignIn} loading={loading} error={error} />
      )}
    </div>
  );
}
```

### Orders Hook

```typescript
import { useOrders } from '@restopapa/api-client';

function OrdersList() {
  const { orders, loading, fetchOrders, updateOrderStatus } = useOrders();
  const { client } = useApiClient();

  useEffect(() => {
    fetchOrders(client, { page: 1, limit: 20 });
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    await updateOrderStatus(client, orderId, newStatus);
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {orders.map(order => (
        <OrderCard 
          key={order.id} 
          order={order} 
          onStatusUpdate={handleStatusUpdate}
        />
      ))}
    </div>
  );
}
```

### Real-time Updates Hook

```typescript
import { useSocket, useOrderUpdates } from '@restopapa/api-client';

function OrderTracking({ orderId }) {
  const { socket, connect, isConnected } = useSocket();
  const { orderUpdate, subscribeToUpdates } = useOrderUpdates();

  useEffect(() => {
    const socketClient = initializeSocket({
      baseURL: 'https://api.restopapa.com',
      auth: { token: tokens?.accessToken }
    });
    
    connect();
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      subscribeToUpdates(socket, orderId);
    }
  }, [socket, isConnected, orderId]);

  return (
    <div>
      <h3>Order Status: {orderUpdate?.status}</h3>
      {orderUpdate?.estimatedDeliveryTime && (
        <p>ETA: {orderUpdate.estimatedDeliveryTime}</p>
      )}
    </div>
  );
}
```

## Vue Integration

### Setup with Vue 3

```typescript
import { useApiClient } from '@restopapa/api-client';

export default {
  setup() {
    const { initializeClient } = useApiClient();
    
    onMounted(() => {
      initializeClient({
        baseURL: 'https://api.restopapa.com',
      });
    });

    return {};
  }
}
```

### Authentication Composable

```typescript
import { useAuth } from '@restopapa/api-client';

export default {
  setup() {
    const { user, signIn, signOut, loading, error, isAuthenticated } = useAuth();
    const { client } = useApiClient();

    const handleSignIn = async (credentials) => {
      try {
        await signIn(client, credentials);
      } catch (error) {
        console.error('Sign in failed:', error);
      }
    };

    return {
      user,
      loading,
      error,
      isAuthenticated,
      handleSignIn
    };
  }
}
```

### Restaurants Composable

```typescript
import { useRestaurants, usePagination } from '@restopapa/api-client';

export default {
  setup() {
    const { restaurants, loading, fetchRestaurants } = useRestaurants();
    const { page, limit, goToPage, hasNext, hasPrev } = usePagination();
    const { client } = useApiClient();

    const searchRestaurants = async (query) => {
      await fetchRestaurants(client, {
        q: query,
        page: page.value,
        limit: limit.value
      });
    };

    onMounted(() => {
      searchRestaurants('');
    });

    return {
      restaurants,
      loading,
      page,
      hasNext,
      hasPrev,
      searchRestaurants,
      goToPage
    };
  }
}
```

## Advanced Usage

### Custom Error Handling

```typescript
import { isApiError, formatApiError } from '@restopapa/api-client';

apiClient.on('error', (error) => {
  if (isApiError(error)) {
    if (error.statusCode === 401) {
      // Handle authentication error
      window.location.href = '/login';
    } else if (error.statusCode === 429) {
      // Handle rate limiting
      showNotification('Too many requests. Please try again later.');
    }
  }
});
```

### Request Interceptors

```typescript
// The client handles most common cases, but you can access the underlying axios instance
apiClient.client.interceptors.request.use((config) => {
  // Add custom headers
  config.headers['X-Client-Version'] = '1.0.0';
  return config;
});
```

### File Upload with Progress

```typescript
import { useFileUpload } from '@restopapa/api-client';

function FileUploader() {
  const { uploading, progress, uploadFile } = useFileUpload();
  const { client } = useApiClient();

  const handleUpload = async (file) => {
    try {
      const result = await uploadFile(client, file, {
        category: 'menu-images',
        isPublic: true
      });
      console.log('File uploaded:', result.url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploading && (
        <div>
          <p>Uploading... {progress}%</p>
          <progress value={progress} max="100" />
        </div>
      )}
    </div>
  );
}
```

### Search with Suggestions

```typescript
import { useSearch } from '@restopapa/api-client';

function SearchComponent() {
  const { results, suggestions, search, getSuggestions } = useSearch();
  const { client } = useApiClient();
  const [query, setQuery] = useState('');

  const handleSearch = async () => {
    await search(client, query, 'restaurants');
  };

  const handleInputChange = async (value) => {
    setQuery(value);
    if (value.length >= 2) {
      await getSuggestions(client, value, 'restaurants');
    }
  };

  return (
    <div>
      <input 
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder="Search restaurants..."
      />
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map(suggestion => (
            <li key={suggestion} onClick={() => setQuery(suggestion)}>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      <button onClick={handleSearch}>Search</button>
      {results.map(restaurant => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
```

## Configuration Options

### API Client Configuration

```typescript
const apiClient = createApiClient({
  baseURL: 'https://api.restopapa.com',
  timeout: 30000,        // Request timeout in milliseconds
  retries: 3,            // Number of retry attempts
  retryDelay: 1000,      // Base delay between retries
  apiKey: 'your-key',    // Optional API key
  version: 'v1',         // API version
});
```

### Socket Client Configuration

```typescript
const socketClient = createSocketClient({
  baseURL: 'https://api.restopapa.com',
  auth: {
    token: 'jwt-token'   // JWT token for authentication
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
  timeout: 10000
});
```

## API Reference

### Authentication Methods

- `signUp(userData)` - Register a new user
- `signIn(credentials)` - Sign in existing user
- `signOut()` - Sign out current user
- `refreshAccessToken()` - Refresh JWT token

### Restaurant Methods

- `getRestaurants(params?)` - Get restaurants with search/filter
- `getRestaurant(id)` - Get single restaurant by ID
- `createRestaurant(data)` - Create new restaurant
- `updateRestaurant(id, data)` - Update restaurant
- `deleteRestaurant(id)` - Delete restaurant

### Order Methods

- `getOrders(params?)` - Get orders with search/filter
- `getOrder(id)` - Get single order by ID
- `createOrder(data)` - Create new order
- `updateOrderStatus(id, status)` - Update order status

### Menu Methods

- `getMenus(restaurantId, params?)` - Get restaurant menus
- `getMenu(restaurantId, menuId)` - Get specific menu
- `createMenu(restaurantId, data)` - Create new menu
- `updateMenu(restaurantId, menuId, data)` - Update menu

### Payment Methods

- `createPaymentIntent(data)` - Create payment intent
- `confirmPayment(id, gateway)` - Confirm payment

### File Methods

- `uploadFile(file, options?)` - Upload single file
- `deleteFile(id)` - Delete uploaded file

### Search Methods

- `globalSearch(query, type?)` - Global search across entities
- `getSearchSuggestions(query, type?)` - Get search suggestions

### Analytics Methods

- `getBusinessMetrics(period?)` - Get business analytics
- `getRestaurantAnalytics(id, period?)` - Get restaurant analytics

## Error Handling

The client provides comprehensive error handling with typed error responses:

```typescript
try {
  const result = await apiClient.getRestaurants();
} catch (error) {
  if (error.statusCode === 404) {
    console.log('No restaurants found');
  } else if (error.statusCode === 429) {
    console.log('Rate limited');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## TypeScript Support

The client includes complete TypeScript definitions for all API responses:

```typescript
import { Restaurant, Order, User, ApiResponse } from '@restopapa/api-client';

const restaurant: Restaurant = await apiClient.getRestaurant('123');
const orders: ApiResponse<Order[]> = await apiClient.getOrders();
const user: User = await apiClient.getUserProfile();
```

## Testing

Mock the API client for testing:

```typescript
import { RestoPapaApiClient } from '@restopapa/api-client';

// Mock implementation
const mockApiClient = {
  signIn: jest.fn().mockResolvedValue({
    data: { user: mockUser, tokens: mockTokens }
  }),
  getRestaurants: jest.fn().mockResolvedValue({
    data: mockRestaurants,
    pagination: mockPagination
  })
};

// Use in tests
test('should sign in user', async () => {
  const result = await mockApiClient.signIn(credentials);
  expect(result.data.user.id).toBe(mockUser.id);
});
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: [https://docs.restopapa.com](https://docs.restopapa.com)
- Issues: [GitHub Issues](https://github.com/restopapa/api-client/issues)
- Email: support@restopapa.com