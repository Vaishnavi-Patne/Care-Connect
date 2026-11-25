import os
import mysql.connector

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("CARECONNECT_DB_HOST", "127.0.0.1"),
            user=os.getenv("CARECONNECT_DB_USER", "careconnect_app"),
            password=os.getenv("CARECONNECT_APP_DB_PASSWORD"),
            database=os.getenv("CARECONNECT_DB_NAME", "careconnect_db"),
            port=int(os.getenv("CARECONNECT_DB_PORT", "3306"))
        )
        return connection

    except mysql.connector.Error as error:
        print("Database connection error:", error)
        return None
