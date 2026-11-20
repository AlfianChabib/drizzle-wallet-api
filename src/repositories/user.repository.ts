import { eq, sql } from "drizzle-orm";
import { type DbClient, db } from "../config/database.ts";
import { type NewUser, type User, users } from "../db/schema/users.ts";

export class UserRepository {
  async findByEmail(email: string, client: DbClient = db): Promise<User | undefined> {
    const [user] = await client.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async findById(id: string, client: DbClient = db): Promise<User | undefined> {
    const [user] = await client.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async create(data: NewUser, client: DbClient = db): Promise<User> {
    const [user] = await client.insert(users).values(data).returning();
    if (!user) throw new Error("Failed to create user record");
    return user;
  }

  async updatePin(id: string, pinHash: string, client: DbClient = db): Promise<void> {
    await client
      .update(users)
      .set({
        pinHash,
        failedPinAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async incrementFailedPin(id: string, client: DbClient = db): Promise<number> {
    const [updated] = await client
      .update(users)
      .set({
        failedPinAttempts: sql`${users.failedPinAttempts} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({ failedPinAttempts: users.failedPinAttempts });

    return updated?.failedPinAttempts ?? 0;
  }

  async resetFailedPin(id: string, client: DbClient = db): Promise<void> {
    await client
      .update(users)
      .set({
        failedPinAttempts: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }
}

export const userRepository = new UserRepository();
