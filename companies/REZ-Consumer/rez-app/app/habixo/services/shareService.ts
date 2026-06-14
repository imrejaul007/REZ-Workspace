// @ts-nocheck
// Habixo Share Service
// Share functionality for properties, bookings, and app referrals
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { Alert, Share, Platform } from 'react-native';

// Share options
export interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
  subject?: string;
}

// Share a property listing
export async function shareProperty(
  propertyTitle: string,
  propertyId: string,
  propertyImage?: string
): Promise<boolean> {
  const shareUrl = `https://habixo.com/property/${propertyId}`;
  const shareText = `Check out this amazing property: ${propertyTitle}\n\nBook now on Habixo - Smart Living OS powered by ReZ`;

  try {
    if (Platform.OS === 'ios') {
      await Share.share({
        title: propertyTitle,
        message: `${shareText}\n\n${shareUrl}`,
        url: propertyImage, // iOS allows sharing image URL
      });
    } else {
      await Share.share({
        title: propertyTitle,
        message: `${shareText}\n\n${shareUrl}`,
      });
    }
    return true;
  } catch (error) {
    logger.error('Error sharing property:', error);
    return false;
  }
}

// Share booking details
export async function shareBooking(
  bookingId: string,
  propertyName: string,
  checkIn: string,
  checkOut: string,
  guestName: string
): Promise<boolean> {
  const shareUrl = `https://habixo.com/bookings/${bookingId}`;
  const shareText = `My Habixo Booking\n\nProperty: ${propertyName}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nGuest: ${guestName}\n\nBook your next stay at Habixo!`;

  try {
    await Share.share({
      title: `Habixo Booking - ${propertyName}`,
      message: `${shareText}\n\n${shareUrl}`,
    });
    return true;
  } catch (error) {
    logger.error('Error sharing booking:', error);
    return false;
  }
}

// Share referral code
export async function shareReferralCode(
  referralCode: string,
  referralBonus: string
): Promise<boolean> {
  const shareText = `Join Habixo and earn ${referralBonus} on your first booking!\n\nUse my referral code: ${referralCode}\n\nDownload Habixo - Smart Living OS powered by ReZ\nhttps://habixo.com/download`;

  try {
    await Share.share({
      title: 'Invite Friends to Habixo',
      message: shareText,
    });
    return true;
  } catch (error) {
    logger.error('Error sharing referral:', error);
    return false;
  }
}

// Copy link to clipboard
export async function copyPropertyLink(propertyId: string): Promise<boolean> {
  const link = `https://habixo.com/property/${propertyId}`;
  try {
    await Clipboard.setStringAsync(link);
    return true;
  } catch (error) {
    logger.error('Error copying link:', error);
    return false;
  }
}

// Copy referral code to clipboard
export async function copyReferralCode(code: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(code);
    return true;
  } catch (error) {
    logger.error('Error copying referral code:', error);
    return false;
  }
}

// Check if sharing is available
export async function isSharingAvailable(): Promise<boolean> {
  return await Sharing.isAvailableAsync();
}

// Share generic content
export async function shareContent(options: ShareOptions): Promise<boolean> {
  try {
    const result = await Share.share({
      title: options.title,
      message: options.message,
      url: options.url,
    });

    return result.action === Share.sharedAction;
  } catch (error) {
    logger.error('Error sharing content:', error);
    return false;
  }
}

// Show share menu with multiple options
export function showShareMenu(
  title: string,
  options: Array<{
    label: string;
    icon: string;
    onPress: () => Promise<boolean>;
  }>
): void {
  const actionSheet = options.map((opt, index) => ({
    text: `${opt.icon} ${opt.label}`,
    onPress: async () => {
      const success = await opt.onPress();
      if (!success) {
        Alert.alert('Error', 'Failed to share. Please try again.');
      }
    },
  }));

  Alert.alert(title, 'Choose how to share', [
    ...actionSheet,
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

// Generate shareable property summary
export function generatePropertyShareText(
  property: {
    title: string;
    location: string;
    price: number;
    rating: number;
  },
  propertyId: string
): string {
  return `${property.title} in ${property.location}
Price: ₹${property.price}/night
Rating: ⭐ ${property.rating}
Book now: https://habixo.com/property/${propertyId}`;
}

export default {
  shareProperty,
  shareBooking,
  shareReferralCode,
  copyPropertyLink,
  copyReferralCode,
  isSharingAvailable,
  shareContent,
  showShareMenu,
  generatePropertyShareText,
};
