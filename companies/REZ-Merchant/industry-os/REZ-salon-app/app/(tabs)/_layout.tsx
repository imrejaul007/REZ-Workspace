import { Tabs } from "expo-router";
export default function TabLayout() {
  return <Tabs><Tabs.Screen name="index" options={{ title: "Dashboard" }} /><Tabs.Screen name="appointments" options={{ title: "Appointments" }} /><Tabs.Screen name="clients" options={{ title: "Clients" }} /><Tabs.Screen name="services" options={{ title: "Services" }} /><Tabs.Screen name="profile" options={{ title: "Profile" }} /></Tabs>;
}