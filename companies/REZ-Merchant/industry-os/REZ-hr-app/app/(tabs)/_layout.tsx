import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="employees" options={{ title: "Employees" }} /><Tabs.Screen name="leave" options={{ title: "Leave" }} /><Tabs.Screen name="payroll" options={{ title: "Payroll" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}