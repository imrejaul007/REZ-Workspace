import { View, Text, StyleSheet, ScrollView } from "react-native";
const employees = [{ name: "John Doe", dept: "Engineering", role: "Developer", status: "Active" }, { name: "Sarah Smith", dept: "Marketing", role: "Manager", status: "Active" }];
export default function EmployeesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Employees</Text></View>
      {employees.map((e, i) => (
        <View key={i} style={styles.empCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{e.name.split(" ").map(n => n[0]).join("")}</Text></View>
          <View style={styles.empInfo}><Text style={styles.empName}>{e.name}</Text><Text style={styles.empDept}>{e.dept} - {e.role}</Text></View>
          <View style={styles.statusBadge}><Text style={styles.statusText}>{e.status}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#6366f1" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  empCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#6366f1", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  empInfo: { flex: 1, marginLeft: 12 },
  empName: { fontSize: 16, fontWeight: "600" },
  empDept: { fontSize: 12, color: "#666" },
  statusBadge: { backgroundColor: "#d1fae5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "600", color: "#059669" },
});