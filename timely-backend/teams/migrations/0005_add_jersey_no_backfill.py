from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('teams', '0004_fix_missing_athlete_column'),
    ]

    operations = [
        migrations.RunSQL(
            sql='''
            -- Add jersey_no column if missing
            ALTER TABLE teams_teammember
            ADD COLUMN IF NOT EXISTS jersey_no integer;

            -- Backfill jersey_no from legacy jersey_number if present
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='teams_teammember' AND column_name='jersey_number'
                ) THEN
                    UPDATE teams_teammember
                    SET jersey_no = COALESCE(jersey_no, jersey_number);
                END IF;
            END$$;

            -- Create index if missing
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE c.relkind='i' AND c.relname='teams_teamm_jersey__145b56_idx'
                ) THEN
                    CREATE INDEX teams_teamm_jersey__145b56_idx ON teams_teammember(jersey_no);
                END IF;
            END$$;
            ''',
            reverse_sql='''
            -- No-op safe reverse
            ''',
        ),
    ]


