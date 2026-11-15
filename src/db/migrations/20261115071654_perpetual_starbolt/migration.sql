CREATE TABLE "idempotency_keys" (
	"key" varchar(255) PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"request_hash" varchar(64) NOT NULL,
	"status" varchar(20) NOT NULL,
	"status_code" integer,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY,
	"idempotency_key" varchar(255) UNIQUE,
	"transaction_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'posted' NOT NULL,
	"description" text,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" uuid PRIMARY KEY,
	"code" varchar(100) NOT NULL UNIQUE,
	"type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_postings" (
	"id" uuid PRIMARY KEY,
	"journal_entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"direction" varchar(10) NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY,
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"pin_hash" text,
	"failed_pin_attempts" integer DEFAULT 0 NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"ledger_account_id" uuid NOT NULL UNIQUE,
	"currency" varchar(10) DEFAULT 'IDR' NOT NULL,
	"cached_balance" bigint DEFAULT 0 NOT NULL,
	"daily_transfer_limit" bigint DEFAULT 25000000 NOT NULL,
	"max_per_transfer_limit" bigint DEFAULT 10000000 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idempotency_keys_user_id_idx" ON "idempotency_keys" ("user_id");--> statement-breakpoint
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys" ("expires_at");--> statement-breakpoint
CREATE INDEX "idempotency_keys_status_idx" ON "idempotency_keys" ("status");--> statement-breakpoint
CREATE INDEX "journal_entries_posted_at_idx" ON "journal_entries" ("posted_at");--> statement-breakpoint
CREATE INDEX "journal_entries_tx_type_status_idx" ON "journal_entries" ("transaction_type","status");--> statement-breakpoint
CREATE INDEX "ledger_accounts_type_idx" ON "ledger_accounts" ("type");--> statement-breakpoint
CREATE INDEX "ledger_postings_journal_entry_id_idx" ON "ledger_postings" ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "ledger_postings_account_created_at_idx" ON "ledger_postings" ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "ledger_postings_direction_idx" ON "ledger_postings" ("direction");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" ("role");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" ("created_at");--> statement-breakpoint
CREATE INDEX "wallets_user_id_idx" ON "wallets" ("user_id");--> statement-breakpoint
CREATE INDEX "wallets_status_idx" ON "wallets" ("status");--> statement-breakpoint
CREATE INDEX "wallets_user_status_idx" ON "wallets" ("user_id","status");--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ledger_postings" ADD CONSTRAINT "ledger_postings_journal_entry_id_journal_entries_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ledger_postings" ADD CONSTRAINT "ledger_postings_account_id_ledger_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;