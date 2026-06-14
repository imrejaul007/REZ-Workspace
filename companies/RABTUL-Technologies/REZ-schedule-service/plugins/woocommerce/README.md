# REZ Schedule - WooCommerce Plugin

Add appointment booking to your WooCommerce store.

## Installation

1. Download the plugin zip
2. Go to WordPress Admin > Plugins > Add New > Upload Plugin
3. Activate the plugin
4. Go to Settings > REZ Schedule

## Features

- Display booking widget on products
- Link bookings to WooCommerce orders
- Checkout integration
- Shortcode support

## Configuration

1. **Get API Key** from [api.rez.money](https://api.rez.money)
2. **Enter in Settings**:
   - API Key
   - Default username
   - Theme settings

## Usage

### Shortcode on Product Page

Add to product description or a custom tab:

```
[rez_schedule_product product_id="123" username="shopowner" slug="consultation"]
```

### Auto-embed on All Booking Products

In plugin settings, add product IDs that should show booking:

```
Settings > REZ Schedule > Booking Products
[123, 456, 789]
```

### Widget Options

```
[rez_schedule
  username="shopowner"
  slug="consultation"
  theme="light"
  primary_color="#6366f1"
  height="500px"]
```

## Hooks & Filters

### `rez_schedule_before_widget`
Run code before the booking widget.

```php
add_action('rez_schedule_before_widget', function($product_id) {
  echo '<h3>Book an Appointment</h3>';
});
```

### `rez_schedule_after_booking`
Run code after successful booking.

```php
add_action('rez_schedule_after_booking', function($booking, $product_id) {
  // Add to cart logic
  WC()->cart->add_to_cart($product_id);
});
```

### `rez_schedule_widget_args`
Filter widget arguments.

```php
add_filter('rez_schedule_widget_args', function($args) {
  $args['primaryColor'] = get_option('rez_primary_color');
  return $args;
});
```

## Integration with Checkout

To add booking to checkout flow:

1. Enable "Checkout Integration" in settings
2. Add booking data to cart

```php
// Add booking to cart
WC()->cart->add_meta_data('_rez_booking', [
  'slot' => '2026-05-27T10:00:00Z',
  'event_type' => 'consultation'
]);
```

## Admin Settings

| Setting | Description |
|---------|-------------|
| API Key | Your REZ Schedule API key |
| Default Username | Default booking username |
| Theme | Light/Dark |
| Primary Color | Widget accent color |
| Booking Products | Product IDs that show booking |
| Checkout Integration | Enable/disable |

## Troubleshooting

### Widget not appearing
- Check API key is valid
- Verify product has metafields set
- Check browser console for errors

### CORS errors
- Ensure API key has correct domain
- Check WordPress URL matches

## Support

- Docs: docs.rez.money/schedule/woocommerce
- Support: support@rez.money
