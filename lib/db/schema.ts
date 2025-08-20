import { pgTable, text, uuid, boolean, bigint, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from "drizzle-orm/sql"

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull(),
  path: text("path").notNull(),
  size: bigint("size", { mode:"number" }).notNull(), // bigint for large files
  type: text("type").notNull(),

  fileUrl: text("file_url").notNull(), // nullable for folders
  thumbnailUrl: text("thumbnail_url"),

  fileIdInImageKit: text("file_id_imagekit"),

  userId: text("user_id").notNull(),
  parentId: uuid("parent_id"),

  isFolder: boolean("is_folder").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  isTrash: boolean("is_trash").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
},(table) => ({
  userParentIdx: index("files_user_parent_idx").on(table.userId, table.parentId, table.createdAt),
  
  userTrashIdx: index("files_user_trash_idx")
    .on(table.userId)
    .where(sql`is_trash = true`),
}));


export const filesRelation = relations(files, ({ one, many }) => ({
  parent: one(files, {
    fields: [files.parentId],
    references: [files.id],
  }),
  children: many(files),
}));

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
