import { View, Text, StyleSheet, ScrollView } from "react-native";
const students = [{ name: "John Doe", grade: "10th", attendance: "95%" }, { name: "Jane Smith", grade: "10th", attendance: "92%" }];
export default function StudentsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Students</Text></View>
      {students.map((s, i) => (
        <View key={i} style={styles.studentCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{s.name.split(" ").map(n => n[0]).join("")}</Text></View>
          <View style={styles.studentInfo}><Text style={styles.studentName}>{s.name}</Text><Text style={styles.studentDetails}>{s.grade} • Attendance: {s.attendance}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#2563eb" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  studentCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "bold" },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 16, fontWeight: "600" },
  studentDetails: { fontSize: 12, color: "#666" },
});