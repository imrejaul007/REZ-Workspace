/**
 * RABTUL Services Integration
 * PeopleOS → RABTUL infrastructure
 */

const RABTUL = {
  AUTH: process.env.REZ_AUTH_URL || 'https://rez-auth-service.onrender.com',
  PROFILE: process.env.REZ_PROFILE_URL || 'https://rez-profile-service.onrender.com',
  WALLET: process.env.REZ_WALLET_URL || 'https://rez-wallet-service.onrender.com',
  PAYMENT: process.env.REZ_PAYMENT_URL || 'https://rez-payment-service.onrender.com',
  NOTIFICATIONS: process.env.REZ_NOTIFICATIONS_URL || 'https://rez-notifications-service.onrender.com',
};

// ─── Authentication ─────────────────────────────────────

export async function verifyToken(token: string) {
  const res = await fetch(`${RABTUL.AUTH}/api/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function sendOTP(phone: string) {
  const res = await fetch(`${RABTUL.AUTH}/api/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

// ─── Profile ──────────────────────────────────────────────

export async function getEmployee(id: string) {
  const res = await fetch(`${RABTUL.PROFILE}/employees/${id}`);
  return res.json();
}

export async function updateProfile(id: string, data: any) {
  const res = await fetch(`${RABTUL.PROFILE}/employees/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getDepartments() {
  const res = await fetch(`${RABTUL.PROFILE}/departments`);
  return res.json();
}

// ─── Wallet ───────────────────────────────────────────────

export async function getWalletBalance(employeeId: string) {
  const res = await fetch(`${RABTUL.WALLET}/balance/${employeeId}`);
  return res.json();
}

export async function creditWallet(employeeId: string, amount: number, reason: string) {
  const res = await fetch(`${RABTUL.WALLET}/credit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, amount, reason }),
  });
  return res.json();
}

// ─── Payments ─────────────────────────────────────────────

export async function processPayroll(payrollId: string) {
  const res = await fetch(`${RABTUL.PAYMENT}/payroll/${payrollId}/process`, { method: 'POST' });
  return res.json();
}

export async function payEmployee(employeeId: string, amount: number) {
  const res = await fetch(`${RABTUL.PAYMENT}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, amount }),
  });
  return res.json();
}

// ─── Notifications ────────────────────────────────────────

export async function sendNotification(employeeId: string, message: string, channel: 'push' | 'email' | 'sms' = 'push') {
  const res = await fetch(`${RABTUL.NOTIFICATIONS}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, message, channel }),
  });
  return res.json();
}

export async function sendBulkNotification(employeeIds: string[], message: string) {
  const res = await fetch(`${RABTUL.NOTIFICATIONS}/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeIds, message }),
  });
  return res.json();
}
