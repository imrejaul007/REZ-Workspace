import { View, Text, StyleSheet, ScrollView } from "react-native";
const courses = [{ name: "Mathematics", students: 45, teacher: "Mr. Sharma" }, { name: "Science", students: 38, teacher: "Ms. Gupta" }];
export default function CoursesScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Courses</Text></View>
      {courses.map((c, i) => (
        <View key={i} style={styles.courseCard}><Text style={styles.courseName}>{c.name}</Text><Text style={styles.courseDetails}>{c.students} students • {c.teacher}</Text></View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: 60, backgroundColor: "#2563eb" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  courseCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  courseName: { fontSize: 18, fontWeight: "600" },
  courseDetails: { marginTop: 8, color: "#666" },
});