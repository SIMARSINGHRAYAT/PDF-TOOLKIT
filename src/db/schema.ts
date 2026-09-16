import { customType, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const binary = customType<{ data: Buffer; driverData: Buffer }>({
	dataType() {
		return "bytea";
	},
});

export const pdfResults = pgTable(
	"pdf_results",
	{
		id: text("id").primaryKey(),
		pdf: binary("pdf").notNull(),
		defaultFilename: text("default_filename").notNull(),
		heading: text("heading").notNull(),
		sourcePath: text("source_path").notNull(),
		successMessage: text("success_message").notNull(),
		sizeBytes: integer("size_bytes").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	},
	(table) => [index("pdf_results_expires_at_idx").on(table.expiresAt)],
);
