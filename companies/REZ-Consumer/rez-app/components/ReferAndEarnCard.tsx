// components/ReferAndEarnCard.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator, Linking } from "react-native";
import { platformAlertSimple } from '@/utils/platformAlert';
import { colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import referralService from '@/services/referralApi';

const { width } = Dimensions.get("window");

interface ReferData {
  title: string;
  subtitle: string;
  inviteButtonText: string;
  inviteLink: string;
}

interface ReferAndEarnCardProps {
  data?: ReferData;
  onInvite?: (inviteLink: string) => void;
  isLoading?: boolean;
}

const ReferAndEarnCard: React.FC<ReferAndEarnCardProps> = ({
  data: propData,
  onInvite,
  isLoading: propLoading = false
}) => {
  const [data, setData] = useState<ReferData | null>(null);
  const [loading, setLoading] = useState(false);
  const { isDark, themeColors } = useTheme();
  const cardBg = isDark ? themeColors.background.secondary : '#F6F3FF';
  const cardTitleColor = isDark ? colors.brand.purpleDeep : '#3B1E77';
  const cardSubtitleColor = isDark ? colors.text.secondary : '#555';
  const inviteBtnBg = isDark ? colors.brand.purple : '#8A4DFF';

  useEffect(() => {
    if (propData) {
      setData(propData);
      setLoading(propLoading);
      return;
    }

    let cancelled = false;
    const fetchReferralData = async () => {
      setLoading(true);
      try {
        const response = await referralService.getReferralData();
        if (!cancelled && response.success && response.data) {
          setData({
            title: response.data.title || 'Refer and Earn',
            subtitle: response.data.subtitle || 'Invite your friends and earn rewards',
            inviteButtonText: response.data.inviteButtonText || 'Invite',
            inviteLink: response.data.inviteLink || '',
          });
        } else if (!cancelled) {
          // API returned no data — hide the card by leaving data as null
          setData(null);
        }
      } catch {
        if (!cancelled) {
          // On error, hide the card gracefully
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReferralData();
    return () => { cancelled = true; };
  }, [propData, propLoading]);

  const handleInvite = async () => {
    if (data?.inviteLink) {
      if (onInvite) {
        onInvite(data.inviteLink);
      } else {
        try {
          await Linking.openURL(data.inviteLink);
        } catch (error) {
          platformAlertSimple("Error", "Could not open invite link");
        }
      }
    }
  };

  if (loading || propLoading) {
    return (
      <View style={[styles.card, { justifyContent: "center" }]}>
        <ActivityIndicator size="small" color="#8A4DFF" />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: cardTitleColor }]}>{data?.title}</Text>
        <Text style={[styles.subtitle, { color: cardSubtitleColor }]}>{data?.subtitle}</Text>
      </View>

      <Pressable style={[styles.inviteButton, { backgroundColor: inviteBtnBg }]} onPress={handleInvite}>
        <Text style={styles.inviteText}>{data?.inviteButtonText}</Text>
      </Pressable>
    </View>
  );
};

export default React.memo(ReferAndEarnCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
     width: width * 0.78,
    alignSelf: "center",
    marginTop: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  inviteButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inviteText: {
    color: colors.background.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
