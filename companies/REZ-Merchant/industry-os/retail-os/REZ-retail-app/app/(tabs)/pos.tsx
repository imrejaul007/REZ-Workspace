import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const products = [{ name: "Milk", price: 45 }, { name: "Bread", price: 35 }, { name: "Eggs", price: 60 }, { name: "Butter", price: 120 }, { name: "Cheese", price: 180 }, { name: "Yogurt", price: 80 }];
export default function POSScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Point of Sale</Text></View>
      <View style={styles.productsGrid}>
        {products.map((p, i) => (
          <TouchableOpacity key={i} style={styles.productBtn}>
            <Text style={styles.productName}>{p.name}</Text>
            <Text style={styles.productPrice}>₹{p.price}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.cart}>
        <Text style={styles.cartTitle}>🛒 Cart</Text>
        <View style={styles.cartItem}><Text>Milk x 2</Text><Text>₹90</Text></View>
        <View style={styles.cartItem}><Text>Bread x 1</Text><Text>₹35</Text></View>
        <View style={styles.cartTotal}><Text>Total</Text><Text style={styles.totalAmount}>₹125</Text></View>
        <TouchableOpacity style={styles.checkoutBtn}><Text style={styles.checkoutText}>Checkout</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#7c3aed" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12 },
  productBtn: { width: "30%", backgroundColor: "#fff", padding: 16, borderRadius: 12, alignItems: "center" },
  productName: { fontSize: 14, fontWeight: "500" },
  productPrice: { fontSize: 12, color: "#7c3aed", marginTop: 4 },
  cart: { backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 12 },
  cartTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  cartItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  cartTotal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12, marginTop: 8 },
  totalAmount: { fontSize: 20, fontWeight: "bold", color: "#059669" },
  checkoutBtn: { backgroundColor: "#7c3aed", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 16 },
  checkoutText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});