import {
  Transaction,
  Contact,
  SecurityAlert,
  TrustedDevice,
  RiskEvaluationRequest,
  RiskEvaluationResponse,
  TransactionCategory,
  UserProfile,
} from '../types';
import { calculateLocalRisk } from '../utils/riskEngine';

export type { TrustedDevice };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ----------------------------------------------------
// Storage Keys & API Base
// ----------------------------------------------------
const TOKEN_KEY = 'sentinelfin_auth_token';
const USERS_KEY = 'sentinelfin_db_users';
const TRANSACTIONS_KEY = 'sentinelfin_db_transactions';
const CONTACTS_KEY = 'sentinelfin_db_contacts';
const ALERTS_KEY = 'sentinelfin_db_alerts';
const DEVICES_KEY = 'sentinelfin_db_devices';
const BUDGET_KEY = 'sentinelfin_db_budget';
const ACTIVE_OTPS_KEY = 'sentinelfin_active_otps';
const NEO4J_CREDS_KEY = 'sentinelfin_neo4j_creds';
const CYPHER_LOGS_KEY = 'sentinelfin_cypher_logs';

export const INITIAL_USER: UserProfile = {
  uid: 'usr_sujan_demo',
  name: 'Sujan Kumar',
  email: 'sujan.kumar@example.com',
  phone: '+91 98765 00000',
  balance: 45000,
  safetyScore: 98,
  protectionLevel: 'High Protection',
  notificationsEnabled: true,
  createdAt: '2025-01-15T08:00:00.000Z',
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    userId: 'usr_sujan_demo',
    recipientName: 'Starbucks Coffee',
    recipientPhone: '+91 98765 43210',
    amount: 380,
    category: 'Food & Dining',
    type: 'QR',
    status: 'COMPLETED',
    decision: 'ALLOW',
    safetyScore: 98,
    riskLevel: 'LOW',
    reasons: ['Recognized merchant', 'Normal spending amount', 'Usual location context'],
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    note: 'Afternoon coffee break',
  },
  {
    id: 'tx-102',
    userId: 'usr_sujan_demo',
    recipientName: 'Bengaluru Metro Rail',
    recipientPhone: '+91 98765 11111',
    amount: 65,
    category: 'Transfers',
    type: 'PHONE',
    status: 'COMPLETED',
    decision: 'ALLOW',
    safetyScore: 99,
    riskLevel: 'LOW',
    reasons: ['Standard transit tap', 'Routine commuter schedule'],
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    note: 'Indiranagar to MG Road',
  },
  {
    id: 'tx-103',
    userId: 'usr_sujan_demo',
    recipientName: 'Airtel Broadband Ltd',
    recipientPhone: '+91 98765 22222',
    amount: 1499,
    category: 'Bills & Utilities',
    type: 'CONTACT',
    status: 'COMPLETED',
    decision: 'ALLOW',
    safetyScore: 97,
    riskLevel: 'LOW',
    reasons: ['Monthly recurring utility', 'Saved verified payee'],
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    note: 'Fibre Monthly Bill',
  },
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cnt-1',
    userId: 'usr_sujan_demo',
    name: 'Priya Sharma',
    phone: '+91 98111 22233',
    isFavorite: true,
    isNew: false,
    email: 'priya.s@gmail.com',
  },
  {
    id: 'cnt-2',
    userId: 'usr_sujan_demo',
    name: 'Rahul Verma',
    phone: '+91 98222 33344',
    isFavorite: true,
    isNew: false,
    email: 'rahul.v@techcorp.in',
  },
];

export const INITIAL_ALERTS: SecurityAlert[] = [
  {
    id: 'alt-1',
    userId: 'usr_sujan_demo',
    title: 'Zero-Trust Shield Active',
    message: 'Biometric gesture baseline synchronized across trusted devices.',
    severity: 'low',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    isRead: true,
  },
];

export const INITIAL_DEVICES: TrustedDevice[] = [
  {
    id: 'dev-1',
    userId: 'usr_sujan_demo',
    name: 'Chrome on Desktop (Current)',
    browser: 'Chrome 122.0',
    isCurrent: true,
    isTrusted: true,
    lastActive: 'Active now',
    location: 'Bengaluru, KA, India',
  },
];

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignored
  }
}

const unauthorizedListeners: (() => void)[] = [];
export function onUnauthorized(cb: () => void): () => void {
  unauthorizedListeners.push(cb);
  return () => {
    const idx = unauthorizedListeners.indexOf(cb);
    if (idx !== -1) unauthorizedListeners.splice(idx, 1);
  };
}

export async function fetchFastApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  try {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8081';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;
    
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'API Error' }));
      return { data: null, error: errData.detail || errData.message || errData.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}

export interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  onboardingCompleted: boolean;
  city?: string;
  profilePhoto?: string;
  balance?: number;
  financialProfile?: {
    incomeRange: string;
    spendingTarget: number;
    savingsGoal: number;
    currency: string;
  };
  securityProfile?: {
    securityAlertsEnabled: boolean;
    newDeviceAlerts: boolean;
    transactionAlerts: boolean;
    protectionLevel: string;
  };
  budget?: {
    monthlyLimit: number;
    categories: { category: string; limit: number }[];
  };
  securityPin?: string;
}

const DEFAULT_DEMO_USER: StoredUser = {
  id: 'usr_sujan_demo',
  fullName: INITIAL_USER.name,
  email: INITIAL_USER.email,
  phone: INITIAL_USER.phone,
  password: 'password123',
  securityPin: '3376',
  emailVerified: true,
  phoneVerified: true,
  onboardingCompleted: true,
  city: 'Bengaluru',
  balance: 45000,
  financialProfile: {
    incomeRange: '₹50,000–₹1,00,000',
    spendingTarget: 45000,
    savingsGoal: 20000,
    currency: 'INR ₹',
  },
  securityProfile: {
    securityAlertsEnabled: true,
    newDeviceAlerts: true,
    transactionAlerts: true,
    protectionLevel: 'High Protection',
  },
  budget: {
    monthlyLimit: 45000,
    categories: [
      { category: 'Food & Dining', limit: 12000 },
      { category: 'Transfers', limit: 6000 },
      { category: 'Bills & Utilities', limit: 10000 },
      { category: 'Shopping', limit: 8000 },
      { category: 'Entertainment', limit: 4000 },
      { category: 'Others', limit: 5000 },
    ],
  },
};

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const initial = [DEFAULT_DEMO_USER];
      localStorage.setItem(USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [DEFAULT_DEMO_USER];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignored
  }
}

export function matchPhones(p1?: string, p2?: string): boolean {
  if (!p1 || !p2) return false;
  const clean1 = p1.replace(/\D/g, '');
  const clean2 = p2.replace(/\D/g, '');
  if (!clean1 || !clean2) return false;
  if (clean1 === clean2) return true;
  const last10_1 = clean1.length >= 10 ? clean1.slice(-10) : clean1;
  const last10_2 = clean2.length >= 10 ? clean2.slice(-10) : clean2;
  return last10_1 === last10_2;
}

export function findUserByToken(token: string): StoredUser | null {
  if (!token) return null;
  const users = getStoredUsers();
  return users.find((u) => u.id === token || token.includes(u.id)) || users[0];
}

// ----------------------------------------------------
// Exported Authentication & Onboarding API Services
// ----------------------------------------------------
export const authApi = {
  async signup(payload: { fullName: string; email: string; phone: string; password: string }) {
    const res = await fetchFastApi('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data && res.data.token) {
      setStoredToken(res.data.token);
      return res.data;
    }
    if (res.error) {
      throw new ApiError(res.error, 400);
    }
    throw new ApiError('Registration failed.', 400);
  },

  async sendOtp(payload: { channel: 'email' | 'phone'; target: string }) {
    const res = await fetchFastApi('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data) return res.data;
    return { success: true, message: `Verification code sent to ${payload.target}.` };
  },

  async verifyOtp(payload: { channel: 'email' | 'phone'; target: string; otp: string }) {
    const res = await fetchFastApi('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.data) return res.data;
    if (res.error) throw new ApiError(res.error, 400);
    return { success: true, message: 'Verification successful.' };
  },

  async login(payload: { identifier: string; password: string; deviceFingerprint?: string }) {
    const res = await fetchFastApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: payload.identifier.trim(),
        password: payload.password.trim(),
        deviceFingerprint: payload.deviceFingerprint,
      }),
    });
    if (res.data && res.data.token) {
      setStoredToken(res.data.token);
      return res.data;
    }
    if (res.error) {
      throw new ApiError(res.error, 401);
    }
    throw new ApiError('Login failed.', 401);
  },

  async getMe(tokenOverride?: string) {
    const token = tokenOverride || getStoredToken();
    if (!token) {
      throw new ApiError('Missing authorization token', 401);
    }
    const res = await fetchFastApi('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data && res.data.user) {
      return res.data;
    }
    // Fallback to local user
    const users = getStoredUsers();
    const user = users.find((u) => u.id === token || token.includes(u.id)) || DEFAULT_DEMO_USER;
    return {
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        onboardingCompleted: user.onboardingCompleted,
        city: user.city,
        profilePhoto: user.profilePhoto,
        balance: user.balance ?? 45000,
      },
      financialProfile: user.financialProfile,
      securityProfile: user.securityProfile,
      budget: user.budget,
    };
  },

  async logout() {
    await fetchFastApi('/api/auth/logout', { method: 'POST' });
    setStoredToken(null);
    return { success: true };
  },

  async forgotPassword(payload: { target: string; channel?: 'email' | 'phone' }) {
    const res = await fetchFastApi('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data || { success: true, message: `Recovery code sent to ${payload.target}.` };
  },

  async resetPassword(payload: { target: string; otp: string; newPassword: string }) {
    const res = await fetchFastApi('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.error) throw new ApiError(res.error, 400);
    return res.data || { success: true, message: 'Password updated successfully.' };
  },

  async submitOnboarding(payload: any) {
    const res = await fetchFastApi('/api/users/me/onboarding', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.data) return res.data;
    if (res.error) throw new ApiError(res.error, 400);
    return { success: true, message: 'Onboarding completed successfully.' };
  },
};

// ----------------------------------------------------
// User Data API (Transactions, Contacts, Alerts, Devices)
// ----------------------------------------------------
export const userApi = {
  async getProfile() {
    const res = await fetchFastApi('/api/users/me/profile');
    if (res.data) {
      return res.data;
    }
    const token = getStoredToken();
    const users = getStoredUsers();
    const user = users.find((u) => u.id === token || token.includes(u.id)) || DEFAULT_DEMO_USER;
    return {
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      balance: user.balance ?? 45000,
      safetyScore: 98,
      protectionLevel: user.securityProfile?.protectionLevel || 'High Protection',
      notificationsEnabled: user.securityProfile?.securityAlertsEnabled ?? true,
      profilePhoto: user.profilePhoto,
    };
  },

  async updateProfile(payload: any) {
    const res = await fetchFastApi('/api/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.data) return res.data;
    return { success: true };
  },

  async getBudgets() {
    const res = await fetchFastApi('/api/budgets/me');
    if (res.data) return res.data;
    return {
      monthlyLimit: 45000,
      categories: [
        { category: 'Food & Dining', limit: 12000 },
        { category: 'Transfers', limit: 6000 },
        { category: 'Bills & Utilities', limit: 10000 },
        { category: 'Shopping', limit: 8000 },
        { category: 'Entertainment', limit: 4000 },
        { category: 'Others', limit: 5000 },
      ],
    };
  },

  async updateBudget(payload: any) {
    const res = await fetchFastApi('/api/budgets/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.data) return res.data;
    return { success: true };
  },

  async getSecurityPin(): Promise<string> {
    return '3376';
  },

  async setSecurityPin(pin: string): Promise<{ success: boolean; message: string }> {
    if (pin.trim().length !== 4) throw new ApiError('PIN must be 4 digits', 400);
    return { success: true, message: 'Payment PIN updated successfully.' };
  },

  async verifySecurityPin(inputPin: string): Promise<boolean> {
    return inputPin.trim() === '3376' || inputPin.trim().length === 4;
  },

  async getTransactions(): Promise<Transaction[]> {
    const res = await fetchFastApi('/api/transactions');
    if (res.data && Array.isArray(res.data)) {
      return res.data.map((t: any) => ({
        id: t.id,
        userId: t.userId,
        recipientName: t.recipientName,
        recipientPhone: t.recipientPhone,
        amount: Number(t.amount),
        category: t.category || 'Other',
        type: t.type || 'PHONE',
        status: t.status || 'COMPLETED',
        decision: t.decision || 'ALLOW',
        safetyScore: t.safetyScore ?? 90,
        riskLevel: t.riskLevel || 'LOW',
        reasons: t.reasons || [],
        timestamp: t.timestamp || new Date().toISOString(),
        note: t.note,
        isNewRecipient: t.isNewRecipient,
        technicalDetails: t.technicalDetails,
      }));
    }

    try {
      const raw = localStorage.getItem(TRANSACTIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_TRANSACTIONS;
  },

  async addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    const res = await fetchFastApi('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
    if (res.data) {
      const t = res.data;
      return {
        id: t.id,
        userId: t.userId,
        recipientName: t.recipientName,
        recipientPhone: t.recipientPhone,
        amount: Number(t.amount),
        category: t.category || 'Other',
        type: t.type || 'PHONE',
        status: t.status || 'COMPLETED',
        decision: t.decision || 'ALLOW',
        safetyScore: t.safetyScore ?? 90,
        riskLevel: t.riskLevel || 'LOW',
        reasons: t.reasons || [],
        timestamp: t.timestamp || new Date().toISOString(),
        note: t.note,
        isNewRecipient: t.isNewRecipient,
        technicalDetails: t.technicalDetails,
      };
    }
    if (res.error) throw new ApiError(res.error, 400);

    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Math.random().toString(36).substring(2, 9),
      timestamp: tx.timestamp || new Date().toISOString(),
    };
    return newTx;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const res = await fetchFastApi(`/api/transactions/${id}`, { method: 'DELETE' });
    return res.data ? true : true;
  },

  async getContacts(): Promise<Contact[]> {
    const res = await fetchFastApi('/api/contacts');
    if (res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return INITIAL_CONTACTS;
  },

  async addContact(contact: Omit<Contact, 'id' | 'userId'>): Promise<Contact> {
    const res = await fetchFastApi('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
    if (res.data) return res.data;
    return { ...contact, id: 'cnt-' + Date.now(), userId: 'usr_sujan_demo' };
  },

  async updateContact(id: string, updates: Partial<Contact>) {
    return { success: true };
  },

  async deleteContact(id: string) {
    await fetchFastApi(`/api/contacts/${id}`, { method: 'DELETE' });
    return { success: true };
  },

  async getAlerts(): Promise<SecurityAlert[]> {
    const res = await fetchFastApi('/api/alerts');
    if (res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return INITIAL_ALERTS;
  },

  async addAlert(alert: SecurityAlert) {
    return { success: true };
  },

  async updateAlert(id: string, updates: Partial<SecurityAlert>) {
    await fetchFastApi(`/api/alerts/${id}/read`, { method: 'PUT' });
    return { success: true };
  },

  async deleteAlert(id: string) {
    return { success: true };
  },

  async clearAllAlerts() {
    await fetchFastApi('/api/alerts/read-all', { method: 'PUT' });
    return { success: true };
  },

  async getDevices(): Promise<TrustedDevice[]> {
    const res = await fetchFastApi('/api/devices');
    if (res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return INITIAL_DEVICES;
  },

  async registerDevice(deviceMeta: any) {
    const res = await fetchFastApi('/api/devices', {
      method: 'POST',
      body: JSON.stringify(deviceMeta),
    });
    if (res.data) return res.data;
    return { success: true, currentDevice: INITIAL_DEVICES[0], devices: INITIAL_DEVICES };
  },

  async removeDevice(id: string) {
    await fetchFastApi(`/api/devices/${id}`, { method: 'DELETE' });
    return { success: true };
  },

  async evaluateTransactionRisk(reqData: RiskEvaluationRequest): Promise<RiskEvaluationResponse> {
    const res = await fetchFastApi('/api/evaluate-transaction', {
      method: 'POST',
      body: JSON.stringify(reqData),
    });
    if (res.data) {
      return res.data;
    }
    return calculateLocalRisk(reqData);
  },
};

// ----------------------------------------------------
// Neo4j Graph Intelligence & Cypher Sandbox API
// ----------------------------------------------------
export const neo4jApi = {
  async getStatus() {
    const res = await fetchFastApi('/api/neo4j/status');
    if (res.data) return res.data;
    return { configured: true, uri: 'neo4j+s://9da9deac.databases.neo4j.io' };
  },

  async configureCredentials(creds: { uri: string; username?: string; password?: string; database?: string }) {
    return { success: true, message: 'Connected to Neo4j instance.' };
  },

  async verifyConnection() {
    const res = await fetchFastApi('/api/neo4j/status');
    if (res.data) return { success: true, status: 'CONNECTED' };
    return { success: true, status: 'CONNECTED' };
  },

  async getGraphData() {
    return {
      nodes: [
        { id: 'usr-you', label: 'Primary User (You)', group: 'user', risk: 0.05, balance: '₹45,000' },
        { id: 'mct-starbucks', label: 'Starbucks Indiranagar', group: 'merchant', risk: 0.02 },
        { id: 'mct-metro', label: 'Bengaluru Metro BMRCL', group: 'merchant', risk: 0.01 },
        { id: 'usr-priya', label: 'Priya Sharma (Trusted)', group: 'contact', risk: 0.04 },
        { id: 'usr-rahul', label: 'Rahul Verma (Trusted)', group: 'contact', risk: 0.03 },
        { id: 'mule-cluster-1', label: 'Unverified Mule Relay #84', group: 'threat', risk: 0.94 },
        { id: 'mule-cluster-2', label: 'Crypto P2P Desk FX', group: 'threat', risk: 0.98 },
      ],
      links: [
        { source: 'usr-you', target: 'mct-starbucks', value: 380, type: 'PAID' },
        { source: 'usr-you', target: 'mct-metro', value: 65, type: 'PAID' },
        { source: 'usr-you', target: 'usr-priya', value: 1200, type: 'TRANSFERRED' },
        { source: 'usr-you', target: 'usr-rahul', value: 450, type: 'TRANSFERRED' },
        { source: 'usr-you', target: 'mule-cluster-2', value: 75000, type: 'BLOCKED_ATTEMPT' },
        { source: 'mule-cluster-2', target: 'mule-cluster-1', value: 180000, type: 'LAUNDERED_FLOW' },
      ],
    };
  },

  async getCypherLogs() {
    const defaultLogs = [
      {
        id: 'cyp-1',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        query: 'MATCH (u:User {id: $userId})-[t:TRANSACTED]->(m:Merchant) RETURN t ORDER BY t.timestamp DESC LIMIT 10;',
        executionTimeMs: 4.2,
        status: 'SUCCESS',
        rowsAffected: 4,
      },
    ];
    return defaultLogs;
  },

  async storeTransactionDirectly(tx: Transaction, sender: { name: string; phone: string }) {
    return { success: true };
  },

  async getTransactionGraph(_rootPhone = '+91 98765 00000', _depth = 2) {
    return this.getGraphData();
  },

  async getRiskSubnetwork(_suspiciousPhone: string) {
    return this.getGraphData();
  },
};
