from django.db import migrations


CREATE_TICKETTYPE = r'''
CREATE TABLE IF NOT EXISTS "tickets_tickettype" (
    "id" bigserial PRIMARY KEY,
    "name" varchar(100) NOT NULL,
    "category" varchar(20) NOT NULL DEFAULT 'GENERAL',
    "description" text NOT NULL,
    "price_cents" integer NOT NULL,
    "currency" varchar(3) NOT NULL DEFAULT 'USD',
    "total_quantity" integer NOT NULL,
    "sold_quantity" integer NOT NULL DEFAULT 0,
    "max_per_order" integer NOT NULL DEFAULT 10,
    "sale_start" timestamp with time zone NOT NULL,
    "sale_end" timestamp with time zone NOT NULL,
    "includes_seating" boolean NOT NULL DEFAULT FALSE,
    "includes_amenities" boolean NOT NULL DEFAULT FALSE,
    "is_transferable" boolean NOT NULL DEFAULT TRUE,
    "is_active" boolean NOT NULL DEFAULT TRUE,
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "event_id" bigint NOT NULL REFERENCES "events_event" ("id") DEFERRABLE INITIALLY DEFERRED
);
'''

CREATE_TICKETORDER = r'''
CREATE TABLE IF NOT EXISTS "tickets_ticketorder" (
    "id" bigserial PRIMARY KEY,
    "order_number" varchar(20) UNIQUE NOT NULL,
    "status" varchar(20) NOT NULL DEFAULT 'PENDING',
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "expires_at" timestamp with time zone NOT NULL,
    "payment_provider" varchar(20),
    "provider_reference" varchar(255),
    "payment_amount_cents" integer NOT NULL,
    "payment_currency" varchar(3) NOT NULL DEFAULT 'USD',
    "payment_date" timestamp with time zone,
    "customer_name" varchar(255) NOT NULL,
    "customer_email" varchar(254) NOT NULL,
    "customer_phone" varchar(20),
    "notes" text NOT NULL DEFAULT '',
    "customer_id" bigint NOT NULL REFERENCES "accounts_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "event_id" bigint NOT NULL REFERENCES "events_event" ("id") DEFERRABLE INITIALLY DEFERRED
);
'''

CREATE_PAYMENTRECORD = r'''
CREATE TABLE IF NOT EXISTS "tickets_paymentrecord" (
    "id" bigserial PRIMARY KEY,
    "provider" varchar(20) NOT NULL,
    "provider_reference" varchar(255) NOT NULL,
    "amount_cents" integer NOT NULL,
    "currency" varchar(3) NOT NULL DEFAULT 'USD',
    "status" varchar(20) NOT NULL DEFAULT 'PENDING',
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "processed_at" timestamp with time zone,
    "provider_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "error_message" text NOT NULL DEFAULT '',
    "error_code" varchar(100) NOT NULL DEFAULT '',
    "order_id" bigint NOT NULL REFERENCES "tickets_ticketorder" ("id") DEFERRABLE INITIALLY DEFERRED
);
'''


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(CREATE_TICKETTYPE, reverse_sql="DROP TABLE IF EXISTS \"tickets_tickettype\" CASCADE;"),
        migrations.RunSQL(CREATE_TICKETORDER, reverse_sql="DROP TABLE IF EXISTS \"tickets_ticketorder\" CASCADE;"),
        migrations.RunSQL(CREATE_PAYMENTRECORD, reverse_sql="DROP TABLE IF EXISTS \"tickets_paymentrecord\" CASCADE;"),
    ]


