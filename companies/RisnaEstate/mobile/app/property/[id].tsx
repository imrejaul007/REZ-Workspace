// Mobile - Property Detail Screen
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface Props {
  route: { params: { id: string } };
  navigation: any;
}

export default function PropertyDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;

  // Demo property data
  const property = {
    id,
    title: 'Luxury Marina 2BHK',
    price: 2500000,
    currency: 'AED',
    location: 'Dubai Marina, Dubai',
    bedrooms: 2,
    bathrooms: 2,
    area: 1450,
    type: 'apartment',
    images: ['https://picsum.photos/800/600?random=1'],
    features: ['Pool', 'Gym', 'Parking', 'Security', 'Beach Access'],
    description: 'Stunning 2-bedroom apartment in the heart of Dubai Marina with breathtaking views of the marina and the Arabian Gulf.',
    agent: { name: 'Ahmed Al Maktoum', phone: '+971501234001' },
  };

  return (
    <ScrollView style={styles.container}>
      {/* Image */}
      <Image source={{ uri: property.images[0] }} style={styles.image} />

      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        {/* Price & Title */}
        <Text style={styles.price}>
          {property.currency === 'AED' ? 'AED ' : '₹'}{property.price.toLocaleString()}
        </Text>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.location}>📍 {property.location}</Text>

        {/* Quick Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{property.bedrooms}</Text>
            <Text style={styles.statLabel}>Beds</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{property.bathrooms}</Text>
            <Text style={styles.statLabel}>Baths</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{property.area}</Text>
            <Text style={styles.statLabel}>sq ft</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{property.description}</Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.features}>
            {property.features.map((f, i) => (
              <View key={i} style={styles.feature}>
                <Text style={styles.featureText}>✓ {f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Golden Visa Badge */}
        {property.price >= 2000000 && (
          <View style={styles.visaBadge}>
            <Text style={styles.visaBadgeText}>🌟 Golden Visa Eligible</Text>
          </View>
        )}

        {/* Agent */}
        <View style={styles.agent}>
          <Text style={styles.sectionTitle}>Contact Agent</Text>
          <View style={styles.agentCard}>
            <View style={styles.agentAvatar}>
              <Text style={styles.agentInitial}>{property.agent.name[0]}</Text>
            </View>
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>{property.agent.name}</Text>
              <Text style={styles.agentPhone}>{property.agent.phone}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Text style={styles.callBtnText}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.whatsappBtn}>
            <Text style={styles.whatsappBtnText}>💬 WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookBtn}>
            <Text style={styles.bookBtnText}>📅 Book Site Visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width, height: 300 },
  backBtn: { position: 'absolute', top: 40, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadow: 2 },
  backBtnText: { fontSize: 20 },
  content: { padding: 16 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#059669' },
  title: { fontSize: 20, fontWeight: '600', marginTop: 4 },
  location: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  stats: { flexDirection: 'row', marginTop: 20, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 14, color: '#4b5563', lineHeight: 22 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  feature: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  featureText: { color: '#059669', fontSize: 12 },
  visaBadge: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginTop: 16, alignItems: 'center' },
  visaBadgeText: { color: '#d97706', fontWeight: '600' },
  agent: { marginTop: 24 },
  agentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 12, borderRadius: 12 },
  agentAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0ea5e9', justifyContent: 'center', alignItems: 'center' },
  agentInitial: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  agentInfo: { flex: 1, marginLeft: 12 },
  agentName: { fontSize: 14, fontWeight: '600' },
  agentPhone: { fontSize: 12, color: '#6b7280' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  callBtnText: { fontSize: 18 },
  actions: { marginTop: 24, gap: 12, marginBottom: 40 },
  whatsappBtn: { backgroundColor: '#22c55e', padding: 16, borderRadius: 12, alignItems: 'center' },
  whatsappBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  bookBtn: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 12, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
