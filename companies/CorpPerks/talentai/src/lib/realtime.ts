/**
 * Real-time Updates
 * WebSockets, Notifications
 */

export function notifyUser(userId: string, event: string, data: any) {
  return { userId, event, data, timestamp: Date.now() };
}

export function notifyTeam(teamId: string, message: string) {
  return { team: teamId, message, broadcast: true };
}
