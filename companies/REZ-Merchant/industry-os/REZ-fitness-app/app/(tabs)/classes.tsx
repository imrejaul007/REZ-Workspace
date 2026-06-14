import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
const classes = [
  { name: "Yoga", time: "7:00 AM", trainer: "Sarah", enrolled: 12, max: 20 },
  { name: "HIIT", time: "9:00 AM", trainer: "Mike", enrolled: 18, max: 20 },
  { name: "Zumba", time: "6:00 PM", trainer: "Lisa", enrolled: 25, max: 25 },
  { name: "CrossFit", time: "7:00 PM", trainer: "John", enrolled: 10, max: 15 },
];
export default function ClassesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Classes</Text><TouchableOpacity style={styles.addBtn}><Text style={styles.addBtnText}>+ Schedule</Text></TouchableOpacity></View>
      {classes.map((c, i) => (
        <View key={i} style={styles.classCard}>
          <View style={styles.classTop}><Text style={styles.className}>{c.name}</Text><Text style={styles.classTime}>{c.time}</Text></View>
          <Text style={styles.trainer}>👤 {c.trainer}</Text>
          <View style={styles.enrollmentRow}><View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(c.enrolled / c.max) * 100}%` }]} /></View><Text style={styles.enrollmentText}>{c.enrolled}/{c.max}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#ef4444", flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  addBtn: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: "#ef4444", fontWeight: "600" },
  classCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  classTop: { flexDirection: "row", justifyContent: "space-between" },
  className: { fontSize: 18, fontWeight: "600" },
  classTime: { color: "#ef4444", fontWeight: "500" },
  trainer: { marginTop: 8, color: "#666" },
  enrollmentRow: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  progressBar: { flex: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: "#ef4444", borderRadius: 4 },
  enrollmentText: { fontSize: 12, color: "#666" },
});