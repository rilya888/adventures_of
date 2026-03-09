/**
 * Railway Postgres client
 * Replaces Supabase for DB operations
 */

import { Pool } from "pg";

let pool: Pool | null = null;

export interface DbTransaction {
  query<T = unknown>(text: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null>;
}

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    pool = new Pool({
      connectionString: url,
      ssl: url.includes("railway") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export const db = {
  async query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
    const client = await getPool().connect();
    try {
      const res = await client.query(text, params);
      return (res.rows ?? []) as T[];
    } finally {
      client.release();
    }
  },

  async queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows[0] ?? null;
  },

  async insert(
    table: string,
    data: Record<string, unknown>,
    returning = "id"
  ): Promise<{ id: string } | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const cols = keys.join(", ");
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const text = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING ${returning}`;
    const row = await this.queryOne<{ id: string }>(text, values);
    return row;
  },

  async update(
    table: string,
    set: Record<string, unknown>,
    where: string,
    whereParams: unknown[]
  ): Promise<void> {
    const setKeys = Object.keys(set);
    const setValues = Object.values(set);
    const setClause = setKeys.map((k, i) => `${k} = $${i + 1}`).join(", ");
    const whereStart = setKeys.length + 1;
    const wherePlaceholders = whereParams.map((_, i) => `$${whereStart + i}`).join(" AND ");
    const text = `UPDATE ${table} SET ${setClause} WHERE ${wherePlaceholders}`;
    await this.query(text, [...setValues, ...whereParams]);
  },

  async withTransaction<T>(fn: (tx: DbTransaction) => Promise<T>): Promise<T> {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const tx: DbTransaction = {
        query: async <U>(text: string, params?: unknown[]): Promise<U[]> => {
          const res = await client.query(text, params);
          return (res.rows ?? []) as U[];
        },
        queryOne: async <U>(text: string, params?: unknown[]): Promise<U | null> => {
          const res = await client.query(text, params);
          return (res.rows?.[0] ?? null) as U | null;
        },
      };
      const result = await fn(tx);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};
