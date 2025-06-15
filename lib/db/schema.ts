import { pgTable, text, uuid, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm'


export const files = pgTable("files", {

  id: uuid("id").defaultRandom().primaryKey(),

  // basic file/folder information
  name: text("name").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(), // "Folder"

  // storage information
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),

  // Ownership
  userId: text("user_id").notNull(),
  parentId: uuid("parent_id"), // Parent folder id (null for root items)

  // file/folder flags
  isFolder: boolean("is_folder").default(false).notNull(),
  isStarred: boolean("is_starred").default(false).notNull(),
  isTrash: boolean("is_trash").default(false).notNull(),

  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),

})


export const filesRelation = relations(files, ({one, many}) => ({

  parent: one(files, {
    fields: [files.parentId],
    references: [files.id]
  }),

  // Relationship to child file/folder
  children: many(files)
  
}))


// Type defination

export const File = typeof files.$inferInsert;
export const NewFile = typeof files.$inferSelect;



