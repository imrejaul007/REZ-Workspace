import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="vehicles" options={{ title: "Vehicles" }} /><Tabs.Screen name="drivers" options={{ title: "Drivers" }} /><Tabs.Screen name="alerts" options={{ title: "Alerts" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}