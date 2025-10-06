import sqlite3
import os

# Path to the new SQLite database
DATA_DB = 'data.db'

# Connect to 'data.db' (this will create the file if it doesn't exist)
conn_data = sqlite3.connect(DATA_DB)
cursor_data = conn_data.cursor()

# SQL statement to create the 'Data' table
create_data_table = """
CREATE TABLE IF NOT EXISTS Data (
    prep_time TEXT,
    exam_time TEXT,
    number TEXT,
    fee TEXT
)
"""

try:
    # Execute the CREATE TABLE statement
    cursor_data.execute(create_data_table)
    print("Table 'Data' created successfully in 'data.db'.")

    # Check if the new columns already exist
    cursor_data.execute("PRAGMA table_info(Data)")
    existing_columns = [column[1] for column in cursor_data.fetchall()]

    # Add 'participant' column if it does not exist
    if 'participant' not in existing_columns:
        cursor_data.execute("ALTER TABLE Data ADD COLUMN participant TEXT")
        print("Column 'participant' added to 'Data' table.")

    # Add 'link' column if it does not exist
    if 'link' not in existing_columns:
        cursor_data.execute("ALTER TABLE Data ADD COLUMN link TEXT")
        print("Column 'link' added to 'Data' table.")

    # Check if there's already a row in the table
    cursor_data.execute("SELECT COUNT(*) FROM Data")
    count = cursor_data.fetchone()[0]

    if count == 0:
        # Insert an initial row with all columns set to NULL
        cursor_data.execute(
            "INSERT INTO Data (prep_time, exam_time, number, fee, participant, link) VALUES (?, ?, ?, ?, ?, ?)",
            (None, None, None, None, None, None)
        )
        print("Initial row inserted into 'Data' table.")
    else:
        print(f"'Data' table already has {count} row(s).")

    # Commit the changes
    conn_data.commit()

except sqlite3.Error as e:
    print(f"SQLite Error: {e}")

finally:
    # Close the connection to 'data.db'
    if conn_data:
        conn_data.close()
