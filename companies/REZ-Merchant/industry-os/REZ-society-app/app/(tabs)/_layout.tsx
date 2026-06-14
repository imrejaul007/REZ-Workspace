import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="residents" options={{ title: "Residents" }} /><Tabs.Screen name="maintenance" options={{ title: "Maintenance" }} /><Tabs.Screen name="billing" options={{ title: "Billing" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}