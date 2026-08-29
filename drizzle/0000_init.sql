CREATE TYPE "public"."delivery_status" AS ENUM('ordered', 'shipping', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('credit_card', 'convenience_store', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."preference" AS ENUM('lactose_free', 'vegan', 'low_sugar', 'domestic', 'low_price');--> statement-breakpoint
CREATE TYPE "public"."protein_type" AS ENUM('whey', 'wpi', 'casein', 'soy', 'mix');--> statement-breakpoint
CREATE TYPE "public"."purpose" AS ENUM('muscle', 'diet', 'health');--> statement-breakpoint
CREATE TYPE "public"."timing" AS ENUM('post_workout', 'morning', 'before_sleep', 'snack');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"product_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"product_flavor_snapshot" text NOT NULL,
	"product_image_url_snapshot" text NOT NULL,
	"shop_name_snapshot" text NOT NULL,
	"unit_item_price" integer NOT NULL,
	"shipping_fee" integer NOT NULL,
	"quantity" integer NOT NULL,
	"total_price" integer NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"delivery_status" "delivery_status" DEFAULT 'ordered' NOT NULL,
	"ordered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_quantity_range" CHECK ("orders"."quantity" >= 1 AND "orders"."quantity" <= 5),
	CONSTRAINT "orders_total_price_positive" CHECK ("orders"."total_price" > 0),
	CONSTRAINT "orders_shipping_fee_non_negative" CHECK ("orders"."shipping_fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_preferences" (
	"product_id" uuid NOT NULL,
	"preference" "preference" NOT NULL,
	CONSTRAINT "product_preferences_product_id_preference_pk" PRIMARY KEY("product_id","preference")
);
--> statement-breakpoint
CREATE TABLE "product_purposes" (
	"product_id" uuid NOT NULL,
	"purpose" "purpose" NOT NULL,
	CONSTRAINT "product_purposes_product_id_purpose_pk" PRIMARY KEY("product_id","purpose")
);
--> statement-breakpoint
CREATE TABLE "product_shop_offers" (
	"product_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"item_price" integer NOT NULL,
	CONSTRAINT "product_shop_offers_product_id_shop_id_pk" PRIMARY KEY("product_id","shop_id"),
	CONSTRAINT "product_shop_offers_item_price_positive" CHECK ("product_shop_offers"."item_price" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_store_offers" (
	"product_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"price" integer NOT NULL,
	CONSTRAINT "product_store_offers_product_id_store_id_pk" PRIMARY KEY("product_id","store_id"),
	CONSTRAINT "product_store_offers_price_positive" CHECK ("product_store_offers"."price" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_timings" (
	"product_id" uuid NOT NULL,
	"timing" "timing" NOT NULL,
	CONSTRAINT "product_timings_product_id_timing_pk" PRIMARY KEY("product_id","timing")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"type" "protein_type" NOT NULL,
	"flavor" text NOT NULL,
	"weight_g" integer NOT NULL,
	"protein_content" integer NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"product_group_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_weight_g_positive" CHECK ("products"."weight_g" > 0),
	CONSTRAINT "products_protein_content_range" CHECK ("products"."protein_content" >= 0 AND "products"."protein_content" <= 100)
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"shipping_fee" integer NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shops_shipping_fee_non_negative" CHECK ("shops"."shipping_fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"access" text NOT NULL,
	"phone" text NOT NULL,
	"business_hours" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_preferences" ADD CONSTRAINT "product_preferences_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_purposes" ADD CONSTRAINT "product_purposes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_shop_offers" ADD CONSTRAINT "product_shop_offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_shop_offers" ADD CONSTRAINT "product_shop_offers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_store_offers" ADD CONSTRAINT "product_store_offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_store_offers" ADD CONSTRAINT "product_store_offers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_timings" ADD CONSTRAINT "product_timings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orders_order_number" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orders_idempotency_key" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_orders_ordered_at" ON "orders" USING btree ("ordered_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_product_preferences_value" ON "product_preferences" USING btree ("preference");--> statement-breakpoint
CREATE INDEX "idx_product_purposes_value" ON "product_purposes" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX "idx_offers_shop_product" ON "product_shop_offers" USING btree ("shop_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_product_timings_value" ON "product_timings" USING btree ("timing");--> statement-breakpoint
CREATE INDEX "idx_products_name" ON "products" USING btree ("name","flavor");