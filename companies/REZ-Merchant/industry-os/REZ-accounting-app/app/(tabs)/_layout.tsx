import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="invoices" options={{ title: "Invoices" }} /><Tabs.Screen name="expenses" options={{ title: "Expenses" }} /><Tabs.Screen name="reports" options={{ title: "Reports" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}