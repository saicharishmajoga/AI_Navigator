import sqlite3

def drop_users():
    conn = sqlite3.connect("ai_navigator.db")
    cursor = conn.cursor()
    try:
        cursor.execute("DROP TABLE IF EXISTS users")
        conn.commit()
        print("Successfully dropped users table.")
    except Exception as e:
        print(f"Error dropping users table: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    drop_users()
