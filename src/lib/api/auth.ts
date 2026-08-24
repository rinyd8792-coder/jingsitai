import { delay } from './mock-store';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const USERS_KEY = '__pew_local_users';
const ACTIVE_USER_KEY = '__pew_active_user';

interface LocalUser {
  id: string;
  username: string;
  password: string;
  name: string;
  createdAt: string;
}

function getUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) as LocalUser[] : [];
  } catch { return []; }
}

function saveUsers(users: LocalUser[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch { /* ignore */ }
}

function ensureDemoUser() {
  const users = getUsers();
  if (users.length === 0) {
    saveUsers([{
      id: 'user-demo-001',
      username: 'demo',
      password: 'demo123456',
      name: '演示用户',
      createdAt: new Date().toISOString(),
    }]);
  }
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  ensureDemoUser();
  const users = getUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) throw { error: 'Unauthorized', message: '用户名或密码错误' };
  const token = `mock-token-${user.id}-${Date.now()}`;
  return delay({ token, user: { id: user.id, username: user.username, name: user.name } }, 300);
}

export async function register(username: string, password: string, name?: string): Promise<AuthResponse> {
  ensureDemoUser();
  const users = getUsers();
  if (users.some((u) => u.username === username)) throw { error: 'Conflict', message: '用户名已存在' };
  const newUser: LocalUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    username, password,
    name: name || username,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  const token = `mock-token-${newUser.id}-${Date.now()}`;
  return delay({ token, user: { id: newUser.id, username: newUser.username, name: newUser.name } }, 300);
}

export function setActiveUser(user: AuthUser | null) {
  try {
    user ? localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user)) : localStorage.removeItem(ACTIVE_USER_KEY);
  } catch { /* ignore */ }
}

export function getActiveUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch { return null; }
}
