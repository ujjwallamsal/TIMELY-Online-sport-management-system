from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0005_add_jersey_no_backfill'),
    ]

    operations = [
        migrations.RunSQL(
            sql='''
            -- Add is_captain column if missing with default false
            ALTER TABLE teams_teammember
            ADD COLUMN IF NOT EXISTS is_captain boolean DEFAULT FALSE;

            -- Ensure not null
            ALTER TABLE teams_teammember
            ALTER COLUMN is_captain SET NOT NULL;

            -- Create index if missing
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE c.relkind='i' AND c.relname='teams_teamm_is_capt_a12c03_idx'
                ) THEN
                    CREATE INDEX teams_teamm_is_capt_a12c03_idx ON teams_teammember(is_captain);
                END IF;
            END$$;
            ''',
            reverse_sql='''
            -- No-op safe reverse
            ''',
        ),
    ]


