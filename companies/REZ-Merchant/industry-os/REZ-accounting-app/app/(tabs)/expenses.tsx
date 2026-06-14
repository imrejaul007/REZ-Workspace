import { View, Text, StyleSheet, ScrollView } from "react-native";
const expenses = [{ category: "Office Supplies", amount: "₹5,000", date: "Jun 5" }, { category: "Travel", amount: "₹12,000", date: "Jun 3" }];
export default function ExpensesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Expenses</Text><Text style={styles.subtitle}>Total: ₹1.2L</Text></View>
      {expenses.map((e, i) => (
        <View key={i} style={styles.expCard}><Text style={styles.category}>{e.category}</Text><Text style={styles.amount}>{e.amount}</Text><Text style={styles.date}>{e.date}</Text></View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#059669" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#fff", opacity: 0.8 },
  expCard: { flexDirection: "row", justifyContent: "space-between", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  category: { fontSize: 16, fontWeight: "500" },
  amount: { fontSize: 16, fontWeight: "bold", color: "#dc2626" },
  date: { fontSize: 12, color: "#666" },
});