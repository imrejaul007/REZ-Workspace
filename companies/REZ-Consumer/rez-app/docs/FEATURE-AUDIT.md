# REZ App Ecosystem - Complete Feature Audit

**Generated:** April 26, 2026
**Repository:** rez-app-consumer, rez-app-marchant, rez-app-admin

---

## Executive Summary

The REZ ecosystem is a comprehensive, microservices-based platform with three primary applications:
- **Consumer App** (`rez-app-consumer`) - React Native mobile app
- **Merchant App** (`rez-app-marchant`) - Business management dashboard
- **Admin App** (`rez-app-admin`) - Platform administration console

The ecosystem includes 15+ backend microservices handling distinct business domains.

---

# PART 1: REZ Consumer App Features

## 1.1 Core Shopping Features

| Feature | File Path | Description |
|---------|-----------|-------------|
| Store Discovery | `app/MainStorePage.tsx`, `app/StoreListPage.tsx` | Browse and search stores by location, category |
| Store Details | `app/Store.tsx` | Individual store pages with info, menu, reviews |
| Product Browsing | `app/StoreProductsPage.tsx`, `app/product-page.tsx` | Browse products within stores |
| Product Search | `app/search.tsx`, `services/searchService.ts` | Global search across products/stores |
| Product Comparison | `app/compare.tsx`, `app/explore/compare.tsx` | Compare products side-by-side |
| Category Navigation | `app/categories.tsx`, `app/category/[slug]/` | Browse by category hierarchy |
| Brand Discovery | `app/brands.tsx`, `app/brand/` | Browse stores by brand |
| Mall/Alliance Stores | `app/mall/index.tsx`, `app/mall/alliance-store.tsx` | Mall-specific shopping |
| Deals Section | `app/deals/`, `app/my-deals.tsx` | Active deals and vouchers |
| Lock Deals | `app/lock-deals/` | Time-locked special pricing |
| Flash Sales | `app/flash-sales/`, `app/flash-sale-success.tsx` | Limited-time flash sale events |
| Group Buying | `app/group-buy.tsx`, `services/groupBuyingApi.ts` | Collaborative purchasing |
| Wishlist | `app/wishlist.tsx`, `services/wishlistApi.ts` | Save products for later |
| Products by Category | `app/products/` | Product listing screens |
| Grocery Shopping | `app/grocery/` | Grocery-specific shopping flow |
| Fashion Shopping | `app/fashion.tsx` | Fashion category browsing |
| Electronics | `app/electronics.tsx` | Electronics category |
| Food Ordering | `app/food.tsx` | Restaurant/food delivery |
| Try & Buy | `app/try/` | Product trial experiences |

## 1.2 Cart & Checkout

| Feature | File Path | Description |
|---------|-----------|-------------|
| Cart Management | `app/cart.tsx`, `services/cartApi.ts` | Add, update, remove cart items |
| Cart Validation | `services/cartValidationService.ts` | Real-time cart validation |
| Checkout Flow | `app/checkout.tsx` | Multi-step checkout process |
| Order Placement | `app/order/[storeSlug]/checkout.tsx` | Store-specific checkout |
| Order Confirmation | `app/order-confirmation.tsx` | Post-order confirmation |
| Payment Selection | `app/payment.tsx`, `app/payment-razorpay.tsx` | Choose payment method |

## 1.3 Account & Profile

| Feature | File Path | Description |
|---------|-----------|-------------|
| User Profile | `app/account/profile.tsx`, `app/profile/` | View/edit user profile |
| Profile Settings | `app/account/settings.tsx` | Account preferences |
| Profile Visibility | `app/account/profile-visibility.tsx` | Privacy controls |
| Addresses | `app/account/addresses.tsx` | Manage delivery addresses |
| Delivery Preferences | `app/account/delivery.tsx` | Delivery options |
| Courier Preferences | `app/account/courier-preferences.tsx` | Preferred courier settings |
| Language Settings | `app/account/language.tsx` | Multi-language support |
| Product Preferences | `app/account/products.tsx` | Saved product preferences |
| Account Deletion | `app/account/delete-account.tsx` | Account removal flow |
| Change Password | `app/account/change-password.tsx` | Password management |
| Two-Factor Auth | `app/account/two-factor-auth.tsx` | 2FA setup/management |
| Login/Sign In | `app/sign-in.tsx` | Authentication screen |
| Account Recovery | `app/account-recovery.tsx` | Password/account recovery |

## 1.4 Orders & Bookings

| Feature | File Path | Description |
|---------|-----------|-------------|
| Order History | `app/order-history.tsx`, `app/orders/` | View past orders |
| Order Details | `app/orders/[id].tsx` | Individual order information |
| Order Tracking | `app/tracking.tsx`, `app/pickup-tracking.tsx` | Real-time order tracking |
| Dine-in Tracking | `app/dinein-tracking.tsx` | Track dine-in orders |
| Drive-thru Tracking | `app/drivethru-tracking.tsx` | Drive-thru order status |
| Reorder | `services/reorderApi.ts` | Quick reorder from history |
| Bookings Page | `app/BookingsPage.tsx` | All user bookings |
| My Bookings | `app/my-bookings.tsx` | Personal booking history |
| Booking Details | `app/booking-detail.tsx` | Individual booking info |
| Table Booking | `app/booking/table.tsx`, `services/tableBookingApi.ts` | Restaurant table reservation |
| Appointment Booking | `app/booking/appointment.tsx` | Service appointments |
| Consultation Booking | `app/booking/consultation.tsx` | Expert consultations |
| Reschedule Booking | `app/booking/reschedule/[bookingId].tsx` | Modify bookings |
| Home Delivery | `app/home-delivery.tsx` | Delivery order type |
| Store Visit | `app/store-visit.tsx` | Track in-store visits |
| QR Check-in | `app/qr-checkin.tsx` | In-store QR code check-in |

## 1.5 Payments & Wallet

| Feature | File Path | Description |
|---------|-----------|-------------|
| Wallet Screen | `app/wallet-screen.tsx`, `app/wallet/` | Main wallet dashboard |
| Wallet History | `app/wallet-history.tsx` | Transaction history |
| Wallet Settings | `app/wallet/settings.tsx` | Wallet configuration |
| Coin Management | `app/coins.tsx`, `app/wallet/coin-detail/` | REZ coin balance/transactions |
| Coin Transfer | `app/wallet/transfer.tsx` | Transfer coins to others |
| Coin Gift | `app/wallet/gift.tsx` | Gift coins feature |
| Gift Cards | `app/wallet/gift-cards.tsx` | Purchase/redeem gift cards |
| Store Gift Cards | `app/wallet/store-gift-cards.tsx` | Store-specific gift cards |
| Coin Expiry Tracker | `app/wallet/expiry-tracker.tsx` | Track expiring coins |
| Scheduled Drops | `app/wallet/scheduled-drops.tsx` | Scheduled coin acquisitions |
| Payment Methods | `app/payment-methods.tsx`, `app/account/payment-methods.tsx` | Manage payment options |
| Payment Account | `app/account/payment.tsx` | Payment account settings |
| Rez Cash | `app/rez-cash.tsx` | Platform cash balance |
| REZ Score | `app/rez-score.tsx` | User financial score |
| Cash Store | `app/cash-store/` | Cashback/stored value section |
| Cashback Management | `app/account/cashback.tsx` | Cashback earnings |
| Bill Payment | `app/bill-payment.tsx`, `app/bill-history.tsx` | Pay bills via platform |
| Bill Upload | `app/bill-upload-enhanced.tsx` | Upload bills for rewards |
| Bill Simulator | `app/bill-simulator/` | Bill calculation tool |
| Recharge | `app/recharge.tsx` | Mobile/DTH recharge |

## 1.6 Loyalty & Rewards (Karma)

| Feature | File Path | Description |
|---------|-----------|-------------|
| Karma Home | `app/karma/home.tsx`, `app/karma/karma-index.tsx` | Karma points dashboard |
| My Karma | `app/karma/my-karma.tsx` | Detailed karma balance |
| Karma Leaderboard | `app/karma/leaderboard.tsx` | Karma rankings |
| Karma Scan | `app/karma/scan.tsx` | QR scan for karma |
| Karma Micro Actions | `app/karma/micro-actions.tsx` | Earn karma via actions |
| Karma Missions | `app/karma/missions.tsx` | Karma earning missions |
| Karma Wallet | `app/karma/wallet.tsx` | Karma-specific wallet |
| Karma Events | `app/karma/event/` | Event participation |
| Karma Communities | `app/karma/communities/` | Community karma |
| Coin System | `app/coin-system.tsx` | Branded coins overview |
| Branded Coins | `app/BrandedCoinsScreen.tsx` | Brand-specific coins |
| Loyalty Program | `app/loyalty.tsx` | Loyalty tier system |
| Tier Benefits | `app/tier-benefits.tsx` | Membership tier perks |
| Savings Goals | `app/savings-goals.tsx` | Savings targets |
| Badges | `app/badges.tsx` | Achievement badges |
| Achievements | `app/achievements/` | Achievement tracking |
| Daily Check-in | `app/checkin-history/`, `app/explore/daily-checkin/` | Daily rewards |
| Spin & Win | `app/explore/spin-win.tsx` | Gamified rewards |
| Scratch Card | `app/scratch-card.tsx` | Scratch-to-win rewards |

## 1.7 Travel & Services

| Feature | File Path | Description |
|---------|-----------|-------------|
| Travel Hub | `app/travel/index.tsx` | All travel booking |
| Hotel Search | `app/travel/search.tsx` | Hotel search |
| Hotel Deals | `app/travel/deals.tsx` | Hotel offers |
| Hotel OTA | `app/travel/hotels/` | Hotel booking integration |
| Flights | `app/flight/` | Flight booking |
| Trains | `app/train/` | Train ticket booking |
| Bus Booking | `app/bus/` | Bus ticket booking |
| Cab Booking | `app/cab/` | Taxi/cab rental |
| Package Booking | `app/package/` | Holiday packages |
| Travel Confirmation | `app/travel-booking-confirmation.tsx` | Booking confirmation |
| Insurance | `app/insurance.tsx` | Travel/health insurance |
| Home Services | `app/home-services/` | In-home service booking |
| Service Categories | `app/services/` | Professional services |
| Consultation | `app/booking/consultation.tsx` | Expert consultations |
| Healthcare | `app/healthcare/` | Medical services |
| Pharmacy | `app/healthcare/pharmacy.tsx` | Medicine delivery |
| Lab Tests | `app/healthcare/lab.tsx` | Diagnostic lab booking |
| Dental | `app/healthcare/dental.tsx` | Dental appointments |
| Emergency Services | `app/healthcare/emergency.tsx` | Medical emergencies |
| Health Records | `app/healthcare/records.tsx`, `services/healthRecordsApi.ts` | Medical records |

## 1.8 Social Features

| Feature | File Path | Description |
|---------|-----------|-------------|
| UGC Feed | `app/feed/`, `app/UGCDetailScreen.tsx` | User-generated content |
| UGC Upload | `app/ugc-upload.tsx`, `app/ugc/` | Upload user content |
| Reels/Shorts | `app/explore/reels.tsx`, `app/explore/reel/` | Video content |
| Article Content | `app/articles.tsx`, `app/ArticleDetailScreen.tsx` | Editorial content |
| Explore Feed | `app/explore/` | Discovery feed |
| Map View | `app/explore/map.tsx` | Location-based discovery |
| Hot/Trending | `app/explore/hot.tsx` | Trending content |
| Friends Activity | `app/explore/friends.tsx` | Social activity feed |
| Reviews | `app/my-reviews.tsx`, `app/store-reviews.tsx` | User reviews |
| Review to Earn | `app/explore/review-earn.tsx` | Earn by reviewing |
| Social Impact | `app/social-impact.tsx` | Community initiatives |
| Social Impact Events | `app/social-impact/my-events.tsx` | User's impact events |
| Creator Profiles | `app/creator/[id].tsx` | Content creator pages |
| Creator Apply | `app/creator-apply.tsx` | Become a creator |
| Creator Dashboard | `app/creator-dashboard.tsx` | Creator analytics |
| Creators List | `app/creators.tsx` | Browse creators |
| Social Media Earnings | `app/social-media.tsx` | Social media rewards |
| Earn from Social | `app/earn-from-social-media.tsx` | Social earning campaigns |
| Follow System | `services/followApi.ts` | Follow/unfollow users |
| Share Content | `services/shareService.ts` | Share functionality |
| Products Videos | `app/products-videos.tsx` | Product videos |
| Feed API | `services/feedApi.ts` | Social feed data |
| Activity Feed | `services/activityFeedApi.ts` | Activity stream |

## 1.9 Support & Help

| Feature | File Path | Description |
|---------|-----------|-------------|
| Support Hub | `app/support/index.tsx` | Help center home |
| Chat Support | `app/support/chat.tsx` | Live chat with support |
| Call Support | `app/support/call.tsx` | Phone support |
| FAQ | `app/support/faq.tsx` | Self-help FAQ |
| Create Ticket | `app/support/create-ticket.tsx` | Submit support ticket |
| My Tickets | `app/support/tickets.tsx` | View support tickets |
| Ticket Details | `app/support/ticket/` | Individual ticket |
| Feedback | `app/support/feedback.tsx` | Provide feedback |
| Report Fraud | `app/support/report-fraud.tsx` | Fraud reporting |
| Whats New | `app/whats-new.tsx` | App updates/changelog |

## 1.10 Gamification & Entertainment

| Feature | File Path | Description |
|---------|-----------|-------------|
| Play & Earn | `app/playandearn.tsx`, `app/playandearn/` | Gaming rewards hub |
| Coin Hunt | `app/playandearn/coinhunt.tsx` | Location-based coin game |
| Guess Price | `app/playandearn/guessprice.tsx` | Price guessing game |
| Lucky Draw | `app/playandearn/luckydraw.tsx` | Lottery-style rewards |
| Memory Match | `app/playandearn/memorymatch.tsx` | Card matching game |
| Quiz | `app/playandearn/quiz.tsx` | Trivia quiz rewards |
| Leaderboard | `app/playandearn/leaderboard.tsx`, `app/leaderboard/` | Gaming leaderboards |
| Tournaments | `app/playandearn/TournamentDetail.tsx` | Competitive events |
| Nearby Earn | `app/playandearn/nearby-earn.tsx` | Location-based earning |
| Social Impact Events | `app/playandearn/SocialImpactEventDetail.tsx` | Impact games |
| Games Section | `app/games/` | All games listing |
| Missions | `app/missions.tsx`, `app/mission-detail.tsx` | Game missions |
| Challenges | `app/challenges/` | Achievement challenges |
| Surveys | `app/surveys.tsx` | Survey rewards |

## 1.11 Financial Services

| Feature | File Path | Description |
|---------|-----------|-------------|
| Finance Hub | `app/financial/index.tsx` | All financial services |
| Finance Categories | `app/financial/[category].tsx` | Category-specific finance |
| Service Details | `app/financial/service/[id].tsx` | Individual service info |
| Gold Savings | `app/gold-savings/` | Digital gold investment |
| Smart Spend | `app/smart-spend.tsx`, `app/smart-spending.tsx` | Spending insights |
| Insurance Products | `app/insurance.tsx` | Insurance offerings |
| Investment Products | `app/gold-savings/` | Investment features |

## 1.12 Offers & Promotions

| Feature | File Path | Description |
|---------|-----------|-------------|
| Offers Hub | `app/offers/index.tsx` | All active offers |
| Offer Details | `app/offers/[id].tsx` | Individual offer |
| View All Offers | `app/offers/view-all.tsx` | Complete offers list |
| Sponsored Offers | `app/offers/sponsored.tsx` | Promoted offers |
| AI Recommended | `app/offers/ai-recommended.tsx` | Personalized picks |
| Double Cashback | `app/offers/double-cashback.tsx` | Enhanced cashback |
| Friends Redeemed | `app/offers/friends-redeemed.tsx` | Social proof offers |
| Birthday Offers | `app/offers/birthday.tsx` | Birthday specials |
| Student Offers | `app/offers/student.tsx` | Student discounts |
| Corporate Offers | `app/offers/corporate.tsx` | B2B deals |
| Women Zone | `app/offers/zones/women.tsx` | Gender-specific offers |
| Senior Zone | `app/offers/zones/senior.tsx` | Senior citizen offers |
| Loyalty Zone | `app/offers/zones/loyalty.tsx` | Loyalty tier offers |
| Student Zone | `app/offers/zones/student.tsx` | Student verification zone |
| Heroes Zone | `app/offers/zones/heroes.tsx` | Special heroes offers |
| Bank Offers | `app/bank-offers/` | Bank card deals |
| Card Offers | `app/CardOffersPage.tsx` | Credit/debit card offers |
| Saved Offers | `app/saved-offers.tsx` | Bookmarked offers |
| Prive (Premium) | `app/prive/`, `app/prive-offers/` | Premium member offers |

## 1.13 Onboarding & Engagement

| Feature | File Path | Description |
|---------|-----------|-------------|
| Onboarding Flow | `app/onboarding/` | Multi-step onboarding |
| How REZ Works | `app/how-rez-works.tsx` | App introduction |
| Invites | `app/invite-friends.tsx` | Referral invitations |
| Referral Dashboard | `app/referral/dashboard.tsx` | Track referrals |
| Referral Share | `app/referral/share.tsx` | Share referral code |
| Refer Institute | `app/refer-institute.tsx` | Institutional referrals |
| Referral Program | `app/referral.tsx` | Full referral system |
| Referral Tiers | `services/referralTierApi.ts` | Tier-based referrals |
| Waitlist | `app/waitlist/` | Store waitlist feature |
| Campaigns | `app/campaigns.tsx` | Active campaigns |
| Events | `app/events-list.tsx`, `app/events/` | Event discovery |
| Event Details | `app/EventPage.tsx` | Individual event |
| My Events | `app/my-events.tsx` | User's events |
| Occasions | `app/occasions.tsx` | Special occasions |
| Picks | `app/picks/[id].tsx` | Curated picks |
| Submit Pick | `app/submit-pick.tsx` | Submit recommendations |
| Projects | `app/projects.tsx`, `app/project-detail.tsx` | Community projects |
| Learning Content | `app/learn/[slug].tsx` | Educational content |

---

# PART 2: REZ Merchant App Features

## 2.1 Dashboard & Overview

| Feature | File Path | Description |
|---------|-----------|-------------|
| Dashboard | `app/(dashboard)/index.tsx` | Business overview |
| Analytics Dashboard | `app/analytics/` | Performance analytics |
| Quick Actions | `app/(dashboard)/quick-actions.tsx` | Common tasks |

## 2.2 Order Management

| Feature | File Path | Description |
|---------|-----------|-------------|
| Orders Hub | `app/orders/` | All order management |
| Order Details | `app/orders/` | Individual orders |
| All Table Bookings | `app/all-table-bookings.tsx` | Reservation management |
| Reservations | `app/dine-in/` | Dine-in bookings |
| Table Bookings | `app/(orders)/` | Booking management |

## 2.3 Store & Catalog

| Feature | File Path | Description |
|---------|-----------|-------------|
| Products | `app/products/` | Product management |
| Categories | `app/categories/` | Category management |
| Catalog | `app/catalog/` | Catalog operations |
| Inventory | `app/inventory/` | Stock management |
| Stores | `app/stores/` | Multi-store management |
| Documents | `app/documents/` | Business documents |

## 2.4 POS & Billing

| Feature | File Path | Description |
|---------|-----------|-------------|
| POS System | `app/pos/` | Point of Sale interface |
| QR Generator | `app/qr-generator/` | QR code generation |
| QR Check-in | `app/qr-checkin.tsx` | Scan QR codes |
| KDS | `app/kds/` | Kitchen Display System |
| Floor Plan | `app/floor-plan/` | Restaurant layout |
| Stamp Cards | `app/stamp-cards/` | Loyalty stamp system |

## 2.5 Customer Management

| Feature | File Path | Description |
|---------|-----------|-------------|
| Customers | `app/customers/` | Customer database |
| CRM | `app/crm/` | Customer relationship |
| Loyalty | `app/loyalty/` | Loyalty program management |
| Service Packages | `app/service-packages/` | Subscription packages |
| Gift Cards | `app/gift-cards/` | Gift card program |

## 2.6 Marketing & Promotions

| Feature | File Path | Description |
|---------|-----------|-------------|
| Campaigns | `app/campaigns/` | Marketing campaigns |
| Promotions | `app/promotion-toolkit.tsx` | Promotion builder |
| Discounts | `app/discounts/` | Discount management |
| Marketing | `app/marketing/` | Marketing tools |
| Ads | `app/ads/` | Advertising management |
| Notifications | `app/notifications/` | Push notification management |
| Messages | `app/messages/` | Customer messaging |

## 2.7 Appointments & Services

| Feature | File Path | Description |
|---------|-----------|-------------|
| Appointments | `app/appointments/` | Appointment scheduling |
| Services | `app/services/` | Service management |
| Consultation Forms | `app/consultation-forms/` | Form builder |
| Class Schedule | `app/class-schedule/` | Class/timing management |
| Treatment Rooms | `app/treatment-rooms/` | Resource management |
| Bookings | `app/booking/` | Booking configuration |

## 2.8 Staff & Team

| Feature | File Path | Description |
|---------|-----------|-------------|
| Team | `app/team/` | Staff management |
| Staff Shifts | `app/staff-shifts/` | Shift scheduling |
| Payroll | `app/payroll/` | Salary management |

## 2.9 Finance & Operations

| Feature | File Path | Description |
|---------|-----------|-------------|
| Payouts | `app/payouts/` | Merchant payouts |
| Settlements | `app/settlements/` | Settlement reports |
| Expenses | `app/expenses/` | Expense tracking |
| Reports | `app/reports.tsx` | Business reports |
| Audit | `app/audit/` | Audit trails |
| Khata | `app/khata/` | Credit tracking |
| Rez Capital | `app/rez-capital/` | Business financing |

## 2.10 Settings & Configuration

| Feature | File Path | Description |
|---------|-----------|-------------|
| Settings | `app/settings/` | Store settings |
| Store Config | `app/stores/` | Store configuration |
| Delivery Settings | `app/delivery-settings/` | Delivery options |
| Documents | `app/documents/` | Legal docs |
| Automation | `app/automation/` | Workflow automation |
| Brand | `app/brand/` | Brand management |

## 2.11 Support & Tools

| Feature | File Path | Description |
|---------|-----------|-------------|
| Social Impact | `app/social-impact/` | CSR management |
| Customer Push | `app/customer-push.tsx` | Push campaigns |
| Fraud | `app/fraud/` | Fraud detection |
| Disputes | `app/disputes/` | Dispute resolution |
| Tickets | `app/tickets/` | Support tickets |
| Suppliers | `app/suppliers/` | Supplier management |
| Purchase Orders | `app/purchase-orders/` | PO management |
| Recipes | `app/recipes/` | Recipe management |
| Goals | `app/goals/` | Business goals |
| AOV Rewards | `app/aov-rewards/` | Average order value |
| Upsell Rules | `app/upsell-rules/` | Upsell configuration |

## 2.12 Onboarding

| Feature | File Path | Description |
|---------|-----------|-------------|
| Onboarding Flow | `app/onboarding/` | Merchant onboarding |
| Hotel OTA | `app/hotel-ota.tsx` | Hotel setup |

## 2.13 Premium Services

| Feature | File Path | Description |
|---------|-----------|-------------|
| Subscription | `app/subscription/` | Plan management |
| Cashback | `app/(cashback)/` | Cashback configuration |

---

# PART 3: REZ Admin App Features

## 3.1 User & Identity Management

| Feature | File Path | Description |
|---------|-----------|-------------|
| Users | `app/(dashboard)/users.tsx` | User management |
| Admin Users | `app/(dashboard)/admin-users.tsx` | Admin account management |
| Verifications | `app/(dashboard)/verifications.tsx` | Identity verification |
| Special Profiles | `app/(dashboard)/special-profiles.tsx` | VIP/special accounts |
| Institutions | `app/(dashboard)/institutions.tsx` | Institutional accounts |
| Trial Approvals | `app/(dashboard)/trial-approvals.tsx` | Trial management |

## 3.2 Merchant Management

| Feature | File Path | Description |
|---------|-----------|-------------|
| Merchants | `app/(dashboard)/merchants.tsx` | Merchant directory |
| Merchant Plans | `app/(dashboard)/merchant-plan-analytics.tsx` | Plan analytics |
| Merchant Withdrawals | `app/(dashboard)/merchant-withdrawals.tsx` | Payout management |
| Store Moderation | `app/(dashboard)/stores-moderation.tsx` | Store review |
| Store Collections | `app/(dashboard)/store-collections.tsx` | Store grouping |
| Hotspot Areas | `app/(dashboard)/hotspot-areas.tsx` | Location management |

## 3.3 Order & Transaction Management

| Feature | File Path | Description |
|---------|-----------|-------------|
| Orders | `app/(dashboard)/orders.tsx` | Order management |
| REZ Now Orders | `app/(dashboard)/rez-now-orders.tsx` | Quick orders |
| Table Bookings | `app/(dashboard)/table-bookings.tsx` | Reservations |
| Service Appointments | `app/(dashboard)/service-appointments.tsx` | Appointments |
| Upload Bill Stores | `app/(dashboard)/upload-bill-stores.tsx` | Bill tracking |

## 3.4 Wallet & Finance

| Feature | File Path | Description |
|---------|-----------|-------------|
| Wallet | `app/(dashboard)/wallet.tsx` | Wallet management |
| Wallet Config | `app/(dashboard)/wallet-config.tsx` | Wallet settings |
| Wallet Adjustment | `app/(dashboard)/wallet-adjustment.tsx` | Manual adjustments |
| User Wallets | `app/(dashboard)/user-wallets.tsx` | Per-user wallet |
| Coin Gifts | `app/(dashboard)/coin-gifts.tsx` | Gift transactions |
| Cashback Rules | `app/(dashboard)/cashback-rules.tsx` | Cashback config |
| Coin Rewards | `app/(dashboard)/coin-rewards.tsx` | Reward distribution |
| Coin Governor | `app/(dashboard)/coin-governor.tsx` | Coin economics |
| Gamification Economy | `app/(dashboard)/gamification-economy.tsx` | Economy balance |

## 3.5 Offers & Promotions

| Feature | File Path | Description |
|---------|-----------|-------------|
| Offers | `app/(dashboard)/offers.tsx` | Offer management |
| Offers Sections | `app/(dashboard)/offers-sections.tsx` | Homepage sections |
| Homepage Deals | `app/(dashboard)/homepage-deals.tsx` | Featured deals |
| Flash Sales | `app/(dashboard)/flash-sales.tsx` | Flash sale config |
| Campaigns | `app/(dashboard)/campaigns.tsx` | Campaign management |
| Campaign Management | `app/(dashboard)/campaign-management.tsx` | Advanced campaigns |
| Bank Offers | `app/(dashboard)/bank-offers.tsx` | Bank partnerships |
| Bundle Management | `app/(dashboard)/bundle-management.tsx` | Product bundles |
| Voucher Management | `app/(dashboard)/voucher-management.tsx` | Voucher lifecycle |
| Value Cards | `app/(dashboard)/value-cards.tsx` | Stored value cards |
| Gift Cards Admin | `app/(dashboard)/gift-cards-admin.tsx` | Gift card system |

## 3.6 Gamification & Engagement

| Feature | File Path | Description |
|---------|-----------|-------------|
| Achievements | `app/(dashboard)/achievements.tsx` | Achievement system |
| Challenges | `app/(dashboard)/challenges.tsx` | Challenge events |
| Tournaments | `app/(dashboard)/tournaments.tsx` | Competition events |
| Leaderboard Config | `app/(dashboard)/leaderboard-config.tsx` | Leaderboard settings |
| Daily Check-in | `app/(dashboard)/daily-checkin-config.tsx` | Check-in rewards |
| Game Config | `app/(dashboard)/game-config.tsx` | Game settings |
| Event Rewards | `app/(dashboard)/event-rewards.tsx` | Event prizes |
| Surprise Drops | `app/(dashboard)/surprise-coin-drops.tsx` | Random rewards |
| Extra Rewards | `app/(dashboard)/extra-rewards.tsx` | Bonus rewards |
| Experiences | `app/(dashboard)/experiences.tsx` | Experience system |
| Polls | `app/(dashboard)/polls.tsx` | Survey polls |

## 3.7 Karma & Loyalty

| Feature | File Path | Description |
|---------|-----------|-------------|
| Karma Admin | `app/(dashboard)/karma-admin.tsx` | Karma system management |
| Karma Score | `app/(dashboard)/karma-score.tsx` | Score tracking |
| Loyalty | `app/(dashboard)/loyalty.tsx` | Loyalty program |
| Loyalty Milestones | `app/(dashboard)/loyalty-milestones.tsx` | Tier milestones |
| Membership Config | `app/(dashboard)/membership-config.tsx` | Membership tiers |
| Special Programs | `app/(dashboard)/special-programs.tsx` | Special initiatives |
| Exclusive Zones | `app/(dashboard)/exclusive-zones.tsx` | Zone-based offers |
| Event Categories | `app/(dashboard)/event-categories.tsx` | Event taxonomy |

## 3.8 Content & Social

| Feature | File Path | Description |
|---------|-----------|-------------|
| Creators | `app/(dashboard)/creators.tsx` | Creator management |
| UGC Moderation | `app/(dashboard)/ugc-moderation.tsx` | Content moderation |
| Photo Moderation | `app/(dashboard)/photo-moderation.tsx` | Image review |
| Review Moderation | `app/(dashboard)/review-moderation.tsx` | Review approval |
| Comments Moderation | `app/(dashboard)/comments-moderation.tsx` | Comment filtering |
| Reactions | `app/(dashboard)/reactions.tsx` | Reaction config |
| Reviews | `app/(dashboard)/reviews.tsx` | Review management |
| Social Impact | `app/(dashboard)/social-impact.tsx` | Impact program |
| FAQ Management | `app/(dashboard)/faq-management.tsx` | Help content |
| Learning Content | `app/(dashboard)/learning-content.tsx` | Educational content |
| Articles | `app/(dashboard)/articles.tsx` | Content articles |

## 3.9 Financial & BBPS

| Feature | File Path | Description |
|---------|-----------|-------------|
| BBPS Config | `app/(dashboard)/bbps-config.tsx` | Bill payment config |
| BBPS Providers | `app/(dashboard)/bbps-providers.tsx` | Service providers |
| BBPS Transactions | `app/(dashboard)/bbps-transactions.tsx` | Bill payments |
| BBPS Analytics | `app/(dashboard)/bbps-analytics.tsx` | BBPS metrics |
| BBPS Health | `app/(dashboard)/bbps-health.tsx` | System health |

## 3.10 Notifications & Marketing

| Feature | File Path | Description |
|---------|-----------|-------------|
| Broadcast | `app/(dashboard)/broadcast.tsx` | Mass notifications |
| Notification Mgmt | `app/(dashboard)/notification-management.tsx` | Notification config |
| Engagement Config | `app/(dashboard)/engagement-config.tsx` | Engagement settings |
| Marketing Analytics | `app/(dashboard)/marketing-analytics.tsx` | Campaign metrics |

## 3.11 Fraud & Security

| Feature | File Path | Description |
|---------|-----------|-------------|
| Fraud Alerts | `app/(dashboard)/fraud-alerts.tsx` | Fraud warnings |
| Fraud Queue | `app/(dashboard)/fraud-queue.tsx` | Review queue |
| Fraud Config | `app/(dashboard)/fraud-config.tsx` | Fraud rules |
| Fraud Reports | `app/(dashboard)/fraud-reports.tsx` | Fraud analytics |
| Device Security | `app/(dashboard)/device-security.tsx` | Device management |
| Verifications | `app/(dashboard)/verifications.tsx` | KYC/verification |

## 3.12 Support & Disputes

| Feature | File Path | Description |
|---------|-----------|-------------|
| Support Tickets | `app/(dashboard)/support-tickets.tsx` | Ticket management |
| Support Config | `app/(dashboard)/support-config.tsx` | Support settings |
| Support Tools | `app/(dashboard)/support-tools.tsx` | Support utilities |
| Disputes | `app/(dashboard)/disputes.tsx` | Dispute resolution |
| Pending Approvals | `app/(dashboard)/pending-approvals.tsx` | Approval workflow |

## 3.13 Analytics & Reporting

| Feature | File Path | Description |
|---------|-----------|-------------|
| Analytics Dashboard | `app/(dashboard)/analytics-dashboard.tsx` | Main analytics |
| Revenue | `app/(dashboard)/revenue.tsx` | Revenue metrics |
| Revenue Report | `app/(dashboard)/revenue-report.tsx` | Detailed reports |
| Revenue by Vertical | `app/(dashboard)/revenue-by-vertical.tsx` | Category breakdown |
| Business Metrics | `app/(dashboard)/business-metrics.tsx` | KPI tracking |
| Cohort Analysis | `app/(dashboard)/cohort-analysis.tsx` | User cohorts |
| Funnel Analytics | `app/(dashboard)/funnel-analytics.tsx` | Conversion funnels |
| Web Menu Analytics | `app/(dashboard)/web-menu-analytics.tsx` | Menu performance |

## 3.14 System & Infrastructure

| Feature | File Path | Description |
|---------|-----------|-------------|
| System Health | `app/(dashboard)/system-health.tsx` | Infrastructure status |
| API Latency | `app/(dashboard)/api-latency.tsx` | API performance |
| SLA Monitor | `app/(dashboard)/sla-monitor.tsx` | SLA tracking |
| Job Monitor | `app/(dashboard)/job-monitor.tsx` | Background jobs |
| Alert Rules | `app/(dashboard)/alert-rules.tsx` | Alert configuration |
| Audit Log | `app/(dashboard)/audit-log.tsx` | Activity audit |
| Reconciliation | `app/(dashboard)/reconciliation.tsx` | Financial reconciliation |

## 3.15 Settings & Configuration

| Feature | File Path | Description |
|---------|-----------|-------------|
| Platform Config | `app/(dashboard)/platform-config.tsx` | Platform settings |
| Feature Flags | `app/(dashboard)/feature-flags.tsx` | Feature toggles |
| A/B Test Manager | `app/(dashboard)/ab-test-manager.tsx` | Experiment management |
| Settings | `app/(dashboard)/settings.tsx` | General settings |
| Admin Settings | `app/(dashboard)/admin-settings.tsx` | Admin preferences |
| Economics | `app/(dashboard)/economics.tsx` | Platform economics |
| Whats New | `app/(dashboard)/whats-new.tsx` | Update announcements |

## 3.16 Aggregator & Integration

| Feature | File Path | Description |
|---------|-----------|-------------|
| Aggregator Monitor | `app/(dashboard)/aggregator-monitor.tsx` | Status monitoring |
| Hotels | `app/(dashboard)/hotels.tsx` | Hotel integration |
| Travel | `app/(dashboard)/travel.tsx` | Travel module |
| Mall | `app/(dashboard)/mall.tsx` | Mall management |
| Rendez | `app/(dashboard)/rendez.tsx` | Rendez events |
| Prive | `app/(dashboard)/prive.tsx` | Premium features |
| Prive Campaigns | `app/(dashboard)/prive-campaigns.tsx` | Premium campaigns |
| Cash Store | `app/(dashboard)/cash-store.tsx` | Cashback management |
| Partner Earnings | `app/(dashboard)/partner-earnings.tsx` | Partner payouts |
| Institute Referrals | `app/(dashboard)/institute-referrals.tsx` | Institutional refs |
| Sponsors | `app/(dashboard)/sponsors.tsx` | Sponsorship management |
| Merchant Flags | `app/(dashboard)/merchant-flags/` | Flag management |
| Merchant Live Status | `app/(dashboard)/merchant-live-status.tsx` | Live merchant status |

## 3.17 Live Monitoring

| Feature | File Path | Description |
|---------|-----------|-------------|
| Unified Monitor | `app/(dashboard)/unified-monitor.tsx` | Central monitoring |
| Live Monitor | `app/(dashboard)/live-monitor.tsx` | Real-time status |
| Rez Now Analytics | `app/(dashboard)/rez-now-analytics.tsx` | Quick service analytics |

## 3.18 Delivery & Operations

| Feature | File Path | Description |
|---------|-----------|-------------|
| Delivery Settings | `app/(dashboard)/delivery-settings.tsx` | Delivery config |
| Explore Config | `app/(dashboard)/explore.tsx` | Explore settings |
| Sponsors | `app/(dashboard)/sponsors.tsx` | Sponsored content |
| Perk Management | `app/(dashboard)/perk-management.tsx` | Perk system |

---

# Summary Statistics

| Component | Count |
|-----------|-------|
| Consumer App Screens | 200+ |
| Merchant App Screens | 100+ |
| Admin App Screens | 150+ |
| Backend Services | 15+ |
| Total Features | 500+ |

---

**Document Version:** 1.0
**Last Updated:** April 26, 2026
**Author:** Claude Code (claude-flow)
