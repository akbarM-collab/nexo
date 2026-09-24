import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { INITIAL_DATASET } from '../src/data/seedData.js';
import { DEFAULT_INVESTMENT_ASSETS } from '../src/context/FinancialContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = process.env.DATABASE_FILE
  ? path.resolve(process.cwd(), process.env.DATABASE_FILE)
  : path.resolve(DATA_DIR, 'database.json');

export interface UserAccountDB {
  id: string;
  username: string;
  name: string;
  email: string;
  password: string; // bcrypt hash
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuditLogDB {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  targetUser?: string;
  timestamp: string;
}

export interface SystemConfigDB {
  masterPin: string;
}

export interface DatabaseSchema {
  users: UserAccountDB[];
  security: SystemConfigDB;
  auditLogs: AuditLogDB[];
  datasets: Record<string, any>; // userId -> FinancialDataset
}

function ensureDataDirectory() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function generateInitialData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const userPasswordHash = bcrypt.hashSync('user123', 10);

  const initialAdminUser: UserAccountDB = {
    id: 'user_admin_01',
    username: 'admin',
    name: 'Administrator Utama',
    email: 'admin@nexo.app',
    password: adminPasswordHash,
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const initialStandardUser: UserAccountDB = {
    id: 'user_standard_01',
    username: 'user',
    name: 'Pengguna Demo',
    email: 'user@nexo.app',
    password: userPasswordHash,
    role: 'user',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const masterPin = process.env.SECURITY_PIN || '123456';

  const defaultDataset = {
    ...INITIAL_DATASET,
    assets: DEFAULT_INVESTMENT_ASSETS,
  };

  const initialAuditLog: AuditLogDB = {
    id: 'audit_init',
    action: 'SYSTEM_CONFIG',
    details: 'Sistem Nexo Workspace berhasil diinisialisasi dengan akun Administrator utama.',
    performedBy: 'System Bootstrap',
    timestamp: new Date().toISOString(),
  };

  return {
    users: [initialAdminUser, initialStandardUser],
    security: {
      masterPin,
    },
    auditLogs: [initialAuditLog],
    datasets: {
      user_admin_01: JSON.parse(JSON.stringify(defaultDataset)),
      user_standard_01: JSON.parse(JSON.stringify(defaultDataset)),
    },
  };
}

class DatabaseManager {
  private db: DatabaseSchema;

  constructor() {
    ensureDataDirectory();
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && parsed.security && parsed.datasets) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to read database file, reinitializing:', e);
    }
    const fresh = generateInitialData();
    this.save(fresh);
    return fresh;
  }

  private save(data?: DatabaseSchema) {
    if (data) {
      this.db = data;
    }
    try {
      ensureDataDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public getUsers(): UserAccountDB[] {
    return this.db.users;
  }

  public getUserById(id: string): UserAccountDB | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): UserAccountDB | undefined {
    return this.db.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  }

  public addUser(user: UserAccountDB): void {
    this.db.users.push(user);
    if (!this.db.datasets[user.id]) {
      this.db.datasets[user.id] = JSON.parse(
        JSON.stringify({
          ...INITIAL_DATASET,
          assets: DEFAULT_INVESTMENT_ASSETS,
        })
      );
    }
    this.save();
  }

  public updateUser(id: string, updates: Partial<UserAccountDB>): UserAccountDB | undefined {
    const idx = this.db.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.db.users[idx] = { ...this.db.users[idx], ...updates };
    this.save();
    return this.db.users[idx];
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.db.users.length;
    this.db.users = this.db.users.filter((u) => u.id !== id);
    delete this.db.datasets[id];
    this.save();
    return this.db.users.length < initialLen;
  }

  public getMasterPin(): string {
    return this.db.security.masterPin || process.env.SECURITY_PIN || '123456';
  }

  public updateMasterPin(newPin: string): void {
    this.db.security.masterPin = newPin;
    this.save();
  }

  public getAuditLogs(): AuditLogDB[] {
    return this.db.auditLogs || [];
  }

  public addAuditLog(log: Omit<AuditLogDB, 'id' | 'timestamp'>): AuditLogDB {
    const newLog: AuditLogDB = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    if (!this.db.auditLogs) this.db.auditLogs = [];
    this.db.auditLogs.unshift(newLog);
    this.save();
    return newLog;
  }

  public getUserDataset(userId: string): any {
    if (!this.db.datasets[userId]) {
      this.db.datasets[userId] = JSON.parse(
        JSON.stringify({
          ...INITIAL_DATASET,
          assets: DEFAULT_INVESTMENT_ASSETS,
        })
      );
      this.save();
    }
    return this.db.datasets[userId];
  }

  public saveUserDataset(userId: string, dataset: any): void {
    this.db.datasets[userId] = dataset;
    this.save();
  }
}

export const db = new DatabaseManager();
