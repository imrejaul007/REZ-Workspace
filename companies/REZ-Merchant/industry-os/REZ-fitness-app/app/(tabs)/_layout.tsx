import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="members" options={{ title: "Members" }} /><Tabs.Screen name="classes" options={{ title: "Classes" }} /><Tabs.Screen name="billing" options={{ title: "Billing" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}