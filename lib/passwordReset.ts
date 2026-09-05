import prisma from "@/lib/prisma";
import crypto from "crypto";

export interface PasswordResetTokenRecord {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Generates a random, cryptographically secure 64-character hex token.
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Creates and stores a password reset token in PostgreSQL.
 * Cleans up any existing tokens for the given email first.
 */
export async function createPasswordResetToken(
  email: string,
  token: string,
  expiresAt: Date
): Promise<PasswordResetTokenRecord> {
  const normalizedEmail = email.trim().toLowerCase();
  const id = "prt_" + crypto.randomBytes(12).toString("hex");

  // Invalidate previous tokens for this email
  await prisma.$executeRawUnsafe(
    `DELETE FROM "PasswordResetToken" WHERE LOWER("email") = $1`,
    normalizedEmail
  );

  // Insert new token
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PasswordResetToken" ("id", "email", "token", "expiresAt", "createdAt") 
     VALUES ($1, $2, $3, $4, NOW())`,
    id,
    normalizedEmail,
    token,
    expiresAt
  );

  return {
    id,
    email: normalizedEmail,
    token,
    expiresAt,
    createdAt: new Date(),
  };
}

/**
 * Finds a password reset token by token string.
 */
export async function findPasswordResetToken(
  token: string
): Promise<PasswordResetTokenRecord | null> {
  const results = await prisma.$queryRawUnsafe<PasswordResetTokenRecord[]>(
    `SELECT * FROM "PasswordResetToken" WHERE "token" = $1 LIMIT 1`,
    token
  );

  if (!results || results.length === 0) {
    return null;
  }

  const record = results[0];
  return {
    ...record,
    expiresAt: new Date(record.expiresAt),
    createdAt: new Date(record.createdAt),
  };
}

/**
 * Deletes all password reset tokens for the given email.
 */
export async function deletePasswordResetTokens(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  await prisma.$executeRawUnsafe(
    `DELETE FROM "PasswordResetToken" WHERE LOWER("email") = $1`,
    normalizedEmail
  );
}
