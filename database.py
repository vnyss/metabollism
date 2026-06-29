"""
Handles all database setup and connections.
Uses SQLite — a single file on disk, no separate server needed.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")


def get_db_connection():
    """Open a connection to the database. Each request gets its own."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us access columns by name, e.g. row["username"]
    return conn


def init_db():
    """
    Create the users table if it doesn't exist yet, or migrate it if it does.
    Run this once when the app starts.
    """
    conn = get_db_connection()

    table_exists = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).fetchone()

    if table_exists is None:
        conn.execute("""
            CREATE TABLE users (
                id                      INTEGER PRIMARY KEY AUTOINCREMENT,
                username                TEXT UNIQUE NOT NULL,
                password_hash           TEXT,
                email                   TEXT UNIQUE,
                google_id               TEXT UNIQUE,
                ai_attempts             INTEGER NOT NULL DEFAULT 0,
                created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                full_name               TEXT,
                age                     INTEGER,
                weight_kg               REAL,
                height_cm               REAL,
                gender                  TEXT,
                insult_count            INTEGER NOT NULL DEFAULT 0,
                ban_until               TEXT,
                insult_date             TEXT,
                food_prefs              TEXT,
                country                 TEXT,
                ai_notes                TEXT,
                family_role             TEXT,
                mobility_note           TEXT,
                goal                    TEXT,
                activity_level          TEXT,
                target_weight_kg        REAL,
                exercise_types          TEXT,
                exercise_days_per_week  INTEGER,
                rest_day                TEXT,
                session_duration        TEXT,
                workout_time_pref       TEXT,
                fitness_level           TEXT,
                onboarding_done         INTEGER NOT NULL DEFAULT 0,
                diary_pin_enabled       INTEGER NOT NULL DEFAULT 0,
                diary_pin_hash          TEXT,
                exercise_schedule_json  TEXT,
                day_schedule_json       TEXT,
                blood_report_json       TEXT,
                auth_token              TEXT,
                auth_token_expires      TEXT,
                failed_logins           INTEGER NOT NULL DEFAULT 0,
                lockout_until           TEXT,
                chat_sessions_json      TEXT
            )
        """)
    else:
        columns = [row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()]

        if "google_id" not in columns:
            # Recreate table to add email/google_id and relax password_hash NOT NULL
            conn.execute("ALTER TABLE users RENAME TO users_old")
            conn.execute("""
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT,
                    email TEXT UNIQUE,
                    google_id TEXT UNIQUE,
                    ai_attempts INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.execute("""
                INSERT INTO users (id, username, password_hash, ai_attempts, created_at)
                SELECT id, username, password_hash, ai_attempts, created_at FROM users_old
            """)
            conn.execute("DROP TABLE users_old")
        else:
            if "ai_attempts" not in columns:
                conn.execute(
                    "ALTER TABLE users ADD COLUMN ai_attempts INTEGER NOT NULL DEFAULT 0"
                )
            new_cols = {
                "full_name":    "TEXT",
                "age":          "INTEGER",
                "weight_kg":    "REAL",
                "height_cm":    "REAL",
                "gender":       "TEXT",
                "insult_count": "INTEGER NOT NULL DEFAULT 0",
                "ban_until":    "TEXT",
                "insult_date":  "TEXT",
                "food_prefs":   "TEXT",
                "country":      "TEXT",
                "ai_notes":          "TEXT",
                "family_role":       "TEXT",
                "mobility_note":     "TEXT",
                "goal":                   "TEXT",
                "activity_level":         "TEXT",
                "target_weight_kg":       "REAL",
                "exercise_types":         "TEXT",
                "exercise_days_per_week": "INTEGER",
                "rest_day":               "TEXT",
                "session_duration":       "TEXT",
                "workout_time_pref":      "TEXT",
                "fitness_level":          "TEXT",
                "onboarding_done":        "INTEGER NOT NULL DEFAULT 0",
                "diary_pin_enabled":      "INTEGER NOT NULL DEFAULT 0",
                "diary_pin_hash":         "TEXT",
                "exercise_schedule_json": "TEXT",
                "day_schedule_json":     "TEXT",
                "blood_report_json":     "TEXT",
            }
            for col, col_type in new_cols.items():
                if col not in columns:
                    conn.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")

    # Password reset tokens
    conn.execute("""
        CREATE TABLE IF NOT EXISTS password_resets (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT NOT NULL,
            token      TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used       INTEGER NOT NULL DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()
    print(f"Database ready at {DB_PATH}")


def init_score_db():
    """Create score_events table and add score columns to users if missing."""
    conn = get_db_connection()
    # Event log
    conn.execute("""
        CREATE TABLE IF NOT EXISTS score_events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT NOT NULL,
            event_type  TEXT NOT NULL,
            xp_awarded  REAL NOT NULL DEFAULT 0,
            awarded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            note        TEXT
        )
    """)
    # Add columns to users if they don't exist yet
    cols = [r["name"] for r in conn.execute("PRAGMA table_info(users)").fetchall()]
    for col, typ in [("score_xp","REAL DEFAULT 0"),("score_streak","INTEGER DEFAULT 0"),("score_last_date","TEXT")]:
        if col not in cols:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col} {typ}")
    conn.commit()
    conn.close()


def init_blood_history_db():
    """Create the blood_scan_history table if it doesn't exist."""
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS blood_scan_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT NOT NULL,
            scanned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            label       TEXT,
            result_json TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def init_diary_db():
    """Create the diary_entries table if it doesn't exist."""
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS diary_entries (
            username TEXT NOT NULL,
            date     TEXT NOT NULL,
            entry    TEXT NOT NULL DEFAULT '',
            PRIMARY KEY (username, date)
        )
    """)
    conn.commit()
    conn.close()


def init_food_db():
    """Create the food_nutrition table if it doesn't exist."""
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS food_nutrition (
            food_code    TEXT PRIMARY KEY,
            food_name    TEXT NOT NULL,
            energy_kcal  REAL,
            carb_g       REAL,
            protein_g    REAL,
            fat_g        REAL,
            fibre_g      REAL,
            sodium_mg    REAL,
            calcium_mg   REAL,
            iron_mg      REAL,
            vitc_mg      REAL,
            servings_unit TEXT
        )
    """)
    conn.commit()
    conn.close()


def init_social_db():
    """Create buddies, reactions, and comments tables for the Socials feature."""
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS buddies (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            requester   TEXT NOT NULL,
            recipient   TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'pending',
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(requester, recipient)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS activity_reactions (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id     INTEGER NOT NULL,
            reactor      TEXT NOT NULL,
            emoji        TEXT NOT NULL DEFAULT '👏',
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(event_id, reactor)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS activity_comments (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id     INTEGER NOT NULL,
            commenter    TEXT NOT NULL,
            body         TEXT NOT NULL,
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def init_strava_db():
    """Create challenges, clubs, club_members, and achievements tables."""
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS challenges (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            title       TEXT NOT NULL,
            description TEXT,
            metric      TEXT NOT NULL,
            target      INTEGER NOT NULL,
            period      TEXT NOT NULL DEFAULT 'monthly',
            period_key  TEXT NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS clubs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            description TEXT,
            creator     TEXT NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS club_members (
            club_id   INTEGER NOT NULL,
            username  TEXT NOT NULL,
            role      TEXT NOT NULL DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (club_id, username)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            username  TEXT NOT NULL,
            badge     TEXT NOT NULL,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(username, badge)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS segments (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            description TEXT,
            category    TEXT NOT NULL DEFAULT 'general',
            metric      TEXT NOT NULL DEFAULT 'time',
            creator     TEXT NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS segment_efforts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            segment_id  INTEGER NOT NULL,
            username    TEXT NOT NULL,
            value       REAL NOT NULL,
            note        TEXT,
            logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def init_daily_logs_db():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT NOT NULL,
            date        TEXT NOT NULL,
            data        TEXT NOT NULL,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(username, date)
        )
    """)
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
