/**
 * ReZ Upsell - Shopify Checkout Extension
 *
 * This code is injected into Shopify checkout using checkout.liquid
 */

(function() {
  'use strict';

  const API_URL = window.REZ_UPSELL_API_URL || 'https://upsell.rezapp.com';

  let sessionId = generateSessionId();
  let upsellsShown = 0;
  let maxUpsells = 3;

  // Generate unique session ID using crypto
  function generateSessionId() {
    // Generate UUID without dashes using crypto.getRandomValues
    const uuid = crypto.randomUUID().replace(/-/g, '');
    return 'sess_' + Date.now() + '_' + uuid;
  }

  // Get current cart items
  function getCartItems() {
    const items = [];
    document.querySelectorAll('[data-variant-id]').forEach(el => {
      items.push({
        variantId: el.dataset.variantId,
        productId: el.dataset.productId,
        title: el.dataset.title || 'Product',
        price: parseFloat(el.dataset.price || '0'),
        quantity: parseInt(el.dataset.quantity || '1'),
      });
    });
    return items;
  }

  // Fetch upsell offer
  async function fetchOffer() {
    const shop = window.Shopify?.shop || 'unknown';

    try {
      const response = await fetch(`${API_URL}/upsell/get-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          cartItems: getCartItems(),
          sessionId,
        }),
      });

      const data = await response.json();
      return data.offer;
    } catch (error) {
      console.error('ReZ Upsell: Failed to fetch offer', error);
      return null;
    }
  }

  // Track event
  async function trackEvent(event, offerId, productId, revenue = 0) {
    const shop = window.Shopify?.shop || 'unknown';

    try {
      await fetch(`${API_URL}/upsell/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop,
          sessionId,
          offerId,
          productId,
          event,
          revenue,
        }),
      });
    } catch (error) {
      console.error('ReZ Upsell: Failed to track event', error);
    }
  }

  // Create upsell popup
  function createUpsellPopup(offer) {
    const popup = document.createElement('div');
    popup.id = 'rez-upsell-popup';
    popup.innerHTML = `
      <style>
        #rez-upsell-popup {
          position: fixed;
          bottom: 20px;
          right: 20px;
          max-width: 380px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          padding: 24px;
          z-index: 99999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          animation: rez-slide-up 0.3s ease-out;
        }
        @keyframes rez-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rez-upsell-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border: none;
          background: #f0f0f0;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rez-upsell-product {
          display: flex;
          gap: 16px;
          margin: 16px 0;
        }
        .rez-upsell-product img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
          background: #f8f8f8;
        }
        .rez-upsell-info {
          flex: 1;
        }
        .rez-upsell-title {
          font-weight: 600;
          font-size: 16px;
          color: #1a1a1a;
          margin: 0 0 4px;
        }
        .rez-upsell-prices {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .rez-upsell-price {
          font-weight: 700;
          font-size: 18px;
          color: #0ea5e9;
        }
        .rez-upsell-compare {
          font-size: 14px;
          color: #999;
          text-decoration: line-through;
        }
        .rez-upsell-discount {
          background: #dcfce7;
          color: #16a34a;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .rez-upsell-message {
          font-size: 14px;
          color: #666;
          margin: 0 0 16px;
        }
        .rez-upsell-buttons {
          display: flex;
          gap: 12px;
        }
        .rez-upsell-accept {
          flex: 1;
          padding: 12px 16px;
          background: #0ea5e9;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .rez-upsell-accept:hover {
          background: #0284c7;
        }
        .rez-upsell-decline {
          padding: 12px 16px;
          background: #f0f0f0;
          color: #666;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }
        .rez-upsell-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fef3c7;
          color: #92400e;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 12px;
        }
      </style>

      <div class="rez-upsell-badge">
        <span>⚡</span> Special Offer Just For You!
      </div>

      <button class="rez-upsell-close" onclick="closeReZUpsell()">×</button>

      <div class="rez-upsell-product">
        ${offer.product.image ? `<img src="${offer.product.image}" alt="${offer.product.title}">` : '<div style="width:80px;height:80px;background:#f8f8f8;border-radius:8px;display:flex;align-items:center;justify-content:center;">📦</div>'}
        <div class="rez-upsell-info">
          <h3 class="rez-upsell-title">${offer.product.title}</h3>
          <div class="rez-upsell-prices">
            <span class="rez-upsell-price">₹${offer.offerPrice}</span>
            <span class="rez-upsell-compare">₹${offer.originalPrice}</span>
            <span class="rez-upsell-discount">-${offer.discountPercentage}%</span>
          </div>
        </div>
      </div>

      <p class="rez-upsell-message">${offer.message}</p>

      <div class="rez-upsell-buttons">
        <button class="rez-upsell-accept" id="rez-upsell-accept-btn">
          Add to Order
        </button>
        <button class="rez-upsell-decline" onclick="declineReZUpsell()">
          No Thanks
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    // Event listeners
    document.getElementById('rez-upsell-accept-btn').addEventListener('click', () => {
      acceptReZUpsell(offer);
    });
  }

  // Accept upsell
  window.acceptReZUpsell = async function(offer) {
    await trackEvent('offer_clicked', offer.id, offer.product.productId);
    await trackEvent('offer_accepted', offer.id, offer.product.productId, offer.offerPrice);

    // Add to cart via Shopify AJAX
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: offer.product.variantId,
        quantity: 1,
      }),
    }).then(() => {
      // Apply discount
      if (offer.discountCode) {
        fetch('/discount/' + offer.discountCode);
      }

      // Close popup and refresh
      closeReZUpsell();
      window.location.reload();
    });
  };

  // Decline upsell
  window.declineReZUpsell = async function() {
    await trackEvent('offer_declined', window.currentReZOffer?.id, window.currentReZOffer?.product?.productId);
    closeReZUpsell();
  };

  // Close popup
  window.closeReZUpsell = function() {
    const popup = document.getElementById('rez-upsell-popup');
    if (popup) {
      popup.remove();
    }
    upsellsShown++;
  };

  // Initialize
  async function init() {
    if (upsellsShown >= maxUpsells) return;

    const offer = await fetchOffer();
    if (offer) {
      window.currentReZOffer = offer;
      createUpsellPopup(offer);
    }
  }

  // Start after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 3000); // 3 second delay
  }
})();
