import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

const categories = ["All", "Starters", "Mains", "Breads", "Beverages", "Desserts"];
const menuItems = [
  { name: "Butter Chicken", category: "Mains", price: 285, stock: 45 },
  { name: "Paneer Tikka", category: "Starters", price: 195, stock: 30 },
  { name: "Veg Biryani", category: "Mains", price: 220, stock: 25 },
  { name: "Garlic Naan", category: "Breads", price: 45, stock: 100 },
  { name: "Masala Chai", category: "Beverages", price: 30, stock: 80 },
  { name: "Gulab Jamun", category: "Desserts", price: 60, stock: 20 },
];

export default function MenuScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {categories.map((cat, i) => (
          <TouchableOpacity key={i} style={[styles.catChip, i === 0 && styles.activeCatChip]}>
            <Text style={[styles.catChipText, i === 0 && styles.activeCatChipText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.menuList}>
        {menuItems.map((item, i) => (
          <View key={i} style={styles.menuItem}>
            <View style={styles.menuInfo}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuCategory}>{item.category}</Text>
              <Text style={styles.menuStock}>Stock: {item.stock}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuPrice}>₹{item.price}</Text>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#f59e0b", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  addBtn: { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: "#f59e0b", fontWeight: "600" },
  categories: { padding: 16, maxHeight: 50 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", marginRight: 8 },
  activeCatChip: { backgroundColor: "#f59e0b" },
  catChipText: { color: "#666" },
  activeCatChipText: { color: "#fff" },
  menuList: { padding: 16, paddingTop: 0 },
  menuItem: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: "row", justifyContent: "space-between" },
  menuInfo: { flex: 1 },
  menuName: { fontSize: 16, fontWeight: "600" },
  menuCategory: { fontSize: 12, color: "#666", marginTop: 2 },
  menuStock: { fontSize: 12, color: "#059669", marginTop: 4 },
  menuRight: { alignItems: "flex-end" },
  menuPrice: { fontSize: 18, fontWeight: "bold", color: "#059669" },
  editBtn: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#f59e0b" },
  editBtnText: { color: "#f59e0b", fontSize: 12 },
});