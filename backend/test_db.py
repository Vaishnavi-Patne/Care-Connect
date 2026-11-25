from database.db_config import get_db_connection

connection = get_db_connection()

if connection:
    print("CareConnect Database Connected Successfully!")

    cursor = connection.cursor()
    cursor.execute("SHOW TABLES")

    print("Database Tables:")
    for table in cursor.fetchall():
        print(table[0])

    cursor.close()
    connection.close()
else:
    print("Database Connection Failed!")