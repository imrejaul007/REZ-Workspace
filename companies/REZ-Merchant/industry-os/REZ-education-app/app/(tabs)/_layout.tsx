import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="courses" options={{ title: "Courses" }} /><Tabs.Screen name="students" options={{ title: "Students" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}