import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';
import type { User } from '../types.ts';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0] || 'Pengguna',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed (getOrCreateUser):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getStaffUsers(): Promise<User[]> {
  try {
    const rows = await db.select().from(users);
    return rows
      .filter((r) => Boolean(r.appUserId))
      .map((r) => ({
        id: r.appUserId || r.uid,
        name: r.name,
        email: r.email,
        role: r.role as User['role'],
        roleTitle: r.roleTitle,
        department: r.department,
        branch: r.branch,
        avatarUrl: r.avatarUrl || undefined,
        phone: r.phone,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        status: (r.status === 'inactive' ? 'inactive' : 'active') as User['status'],
        username: r.username,
        initialUsername: r.initialUsername,
        password: r.password,
        initialPassword: r.initialPassword || undefined,
        lastModifiedCredentialsAt: r.lastModifiedCredentialsAt || undefined,
      }));
  } catch (error) {
    console.error('Database query failed (getStaffUsers):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertStaffUser(userData: User) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid: userData.id,
        appUserId: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        roleTitle: userData.roleTitle,
        department: userData.department,
        branch: userData.branch,
        avatarUrl: userData.avatarUrl || null,
        phone: userData.phone,
        status: userData.status,
        username: userData.username,
        initialUsername: userData.initialUsername,
        password: userData.password,
        initialPassword: userData.initialPassword || null,
        lastModifiedCredentialsAt: userData.lastModifiedCredentialsAt || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          appUserId: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          roleTitle: userData.roleTitle,
          department: userData.department,
          branch: userData.branch,
          avatarUrl: userData.avatarUrl || null,
          phone: userData.phone,
          status: userData.status,
          username: userData.username,
          initialUsername: userData.initialUsername,
          password: userData.password,
          initialPassword: userData.initialPassword || null,
          lastModifiedCredentialsAt: userData.lastModifiedCredentialsAt || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed (upsertStaffUser):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function deleteStaffUser(appUserId: string) {
  try {
    await db.delete(users).where(eq(users.appUserId, appUserId));
  } catch (error) {
    console.error('Database query failed (deleteStaffUser):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
