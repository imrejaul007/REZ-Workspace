import { View, Text, StyleSheet, ScrollView } from "react-native";
const properties = [{ name: "Sunrise Apartments", type: "3BHK", price: "₹85L", location: "Sector 21", status: "Available" }, { name: "Green Valley", type: "2BHK", price: "₹55L", location: "MG Road", status: "Sold" }];
export default function PropertiesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Properties</Text></View>
      {properties.map((p, i) => (
        <View key={i} style={styles.propCard}>
          <Text style={styles.propName}>{p.name}</Text>
          <Text style={styles.propDetails}>{p.type} • {p.location}</Text>
          <View style={styles.propBottom}><Text style={styles.price}>{p.price}</Text><Text style={[styles.status, p.status === "Available" ? styles.availStatus : styles.soldStatus]}>{p.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#a855f7" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  propCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  propName: { fontSize: 16, fontWeight: "600" },
  propDetails: { marginTop: 4, color: "#666" },
  propBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  price: { fontSize: 20, fontWeight: "bold", color: "#059669" },
  status: { fontSize: 12, fontWeight: "600", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  availStatus: { backgroundColor: "#d1fae5", color: "#059669" },
  soldStatus: { backgroundColor: "#e5e7eb", color: "#666" },
});