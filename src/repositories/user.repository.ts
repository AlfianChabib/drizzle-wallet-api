import { eq, sql } from "drizzle-orm";
import { db } from "../config/database.ts";
import { users, type User, type NewUser } from "../db/schema/users.ts";

export class UserRepository {
  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    if (!user) throw new Error("Failed to create user record");
    return user;
  }

  async updatePin(id: string, pinHash: string): Promise<void> {
    await db
      .update(users)
      .set({
        pinHash,
        failedPinAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async incrementFailedPin(id: string): Promise<number> {
    const [updated] = await db
      .update(users)
      .set({
        failedPinAttempts: sql`${users.failedPinAttempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ failedPinAttempts: users.failedPinAttempts });

    return updated?.failedPinAttempts ?? 0;
  }

  async resetFailedPin(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        failedPinAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }
}

export const userRepository = new UserRepository();
