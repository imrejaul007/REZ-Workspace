# REZ Schedule WordPress Plugin

Add appointment booking to any WordPress site with a simple shortcode.

## Installation

1. Download the plugin zip file
2. Go to WordPress Admin > Plugins > Add New > Upload Plugin
3. Activate the plugin
4. Go to Settings > REZ Schedule to configure

## Configuration

1. Go to **Settings > REZ Schedule**
2. Enter your API Key (get one at [api.rez.money](https://api.rez.money))
3. Configure default appearance
4. Save settings

## Usage

### Basic Embed

```
[rez_schedule username="drsharma" slug="consultation"]
```

### With Custom Styling

```
[rez_schedule username="drsharma" slug="consultation" theme="dark" primary_color="#10b981"]
```

### Available Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `username` | string | (required) | Host's username |
| `slug` | string | (required) | Event type slug |
| `theme` | string | `light` | `light` or `dark` |
| `primary_color` | string | `#6366f1` | Primary brand color |
| `height` | string | `500px` | Widget height |
| `border_radius` | string | `12px` | Border radius |

### Examples

**Light Theme (Default)**
```
[rez_schedule username="glamstudio" slug="haircut-styling"]
```

**Dark Theme**
```
[rez_schedule username="glamstudio" slug="haircut-styling" theme="dark"]
```

**Custom Color**
```
[rez_schedule username="drsharma" slug="consultation" primary_color="#10b981"]
```

**Custom Height**
```
[rez_schedule username="drsharma" slug="consultation" height="600px"]
```

### Gutenberg Block

The plugin also includes a Gutenberg block:

1. Add a new block
2. Search for "REZ Schedule"
3. Select and configure in the sidebar

## API Key Management

### Getting an API Key

1. Sign up at [api.rez.money](https://api.rez.money)
2. Go to Dashboard > API Keys
3. Create a new API key
4. Copy and paste into WordPress settings

### API Key Permissions

When creating an API key, you can set permissions:

- **Read Event Types** - View available booking types
- **Create Bookings** - Allow booking creation
- **Read Bookings** - View booking history
- **Manage Webhooks** - Set up integrations

## Webhook Integration

To receive booking notifications in WordPress:

1. Install a webhook receiver plugin (like WP Webhooks)
2. In REZ Schedule dashboard, add webhook URL:
   ```
   https://your-site.com/wp-json/wp-webhooks/v1/rez-schedule
   ```
3. Configure webhook triggers

### Example: Add booking to Contact Form 7

```php
// Add to theme's functions.php
add_action('rez_schedule_booking_created', function($booking) {
    // Get contact form
    $form_id = 123; // Your CF7 form ID
    
    // Create submission
    WPCF7::submit(contact_form, [
        'booking-id' => $booking['uid'],
        'customer-name' => $booking['attendee']['name'],
        'customer-email' => $booking['attendee']['email'],
    ]);
});
```

## Styling

### Custom CSS

Add custom styles via your theme's stylesheet:

```css
/* Custom widget container */
.rez-schedule-widget {
    border: 2px solid #your-color;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* Custom slot buttons */
.rez-schedule-time-slot:hover {
    background-color: #your-color !important;
}
```

## Troubleshooting

### Widget not loading

1. Check browser console for errors
2. Verify API key is correct
3. Ensure username and slug are valid

### CORS errors

If you see CORS errors, make sure your API key has the correct domain whitelisted in the REZ Schedule dashboard.

### Styling conflicts

Use the `data-rez-force-style` attribute to force plugin styles:

```
[rez_schedule username="xxx" slug="yyy" force_style="true"]
```

## Support

- Documentation: [docs.rez.money/schedule/wordpress](https://docs.rez.money/schedule/wordpress)
- Support: support@rez.money
- GitHub: [github.com/reztechnologies/rez-schedule-wordpress](https://github.com/reztechnologies/rez-schedule-wordpress)

## Changelog

### 1.0.0
- Initial release
- Basic booking widget
- Gutenberg block
- API key management
