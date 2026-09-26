import os

import psycopg


def get_connection():
    return psycopg.connect(
        dbname="mntr_app",
        user="postgres",
        password=os.getenv("DB_PASSWORD"),
        host="localhost",
        port=5432,
    )


def insert_device(data):
    connection = None

    try:
        connection = get_connection()

        query = """
            INSERT INTO devices (
                device_id,
                hostname,
                system,
                username,
                ip_address,
                cpu_usage,
                ram_usage,
                last_seen
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP
            )
            ON CONFLICT (device_id)
            DO UPDATE SET
                hostname = EXCLUDED.hostname,
                system = EXCLUDED.system,
                username = EXCLUDED.username,
                ip_address = EXCLUDED.ip_address,
                cpu_usage = EXCLUDED.cpu_usage,
                ram_usage = EXCLUDED.ram_usage,
                last_seen = CURRENT_TIMESTAMP
        """

        with connection.cursor() as cursor:
            cursor.execute(
                query,
                (
                    data["device_id"],
                    data["hostname"],
                    data["system"],
                    data["username"],
                    data["ip_address"],
                    data["cpu_usage"],
                    data["ram_usage"],
                ),
            )

        connection.commit()
        return True

    except psycopg.Error as error:
        print(f"Database error: {error}")
        return False

    finally:
        if connection:
            connection.close()


def get_devices():
    connection = None

    try:
        connection = get_connection()

        query = """
            SELECT
                device_id,
                hostname,
                system,
                username,
                ip_address,
                cpu_usage,
                ram_usage,
                last_seen
            FROM devices
            ORDER BY last_seen DESC
        """

        with connection.cursor() as cursor:
            cursor.execute(query)
            devices = cursor.fetchall()

        return devices

    except psycopg.Error as error:
        print(f"Database error: {error}")
        return None

    finally:
        if connection:
            connection.close()


def insert_resource_history(data):
    connection = None
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            cursor.execute(    """ 
                    INSERT INTO resource_history(
                        device_id,
                        cpu_usage,
                        ram_usage
                    )
                    VALUES (%s ,%s ,%s )
                    """,
                    (
                        data["device_id"],
                        data["cpu_usage"],
                        data["ram_usage"],
                    ),
                )
            

            
            connection.commit()
            return True
    except psycopg.Error as error:
        print(f"Database Error {error}")
        return False
    finally:
        if connection: 
            connection.close()

def get_resource_history(device_id=None,days=None):
    connection = None

    try:
        connection = get_connection()
        if device_id:
            query = """
            SELECT
                device_id,
                AVG(cpu_usage),
                AVG(ram_usage),
                date_trunc('hour', recorded_at)
                    + INTERVAL '10 minutes'
                    * FLOOR(EXTRACT(MINUTE FROM recorded_at) / 10)
            FROM resource_history
            WHERE device_id = %s
            AND recorded_at >= CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
            GROUP BY
                device_id,
                date_trunc('hour', recorded_at)
                    + INTERVAL '10 minutes'
                    * FLOOR(EXTRACT(MINUTE FROM recorded_at) / 10)
            ORDER BY
                date_trunc('hour', recorded_at)
                    + INTERVAL '10 minutes'
                    * FLOOR(EXTRACT(MINUTE FROM recorded_at) / 10)
            """
            params = (device_id, days)
        else:
            query = """
            SELECT
                AVG(cpu_usage),
                AVG(ram_usage),
                date_trunc('hour', recorded_at)
                    + INTERVAL '10 minutes'
                    * FLOOR(EXTRACT(MINUTE FROM recorded_at) / 10)
            FROM resource_history
            WHERE recorded_at >= CURRENT_TIMESTAMP - (%s * INTERVAL '1 day')
            GROUP BY
                date_trunc('hour', recorded_at)
                    + INTERVAL '10 minutes'
                    * FLOOR(EXTRACT(MINUTE FROM recorded_at) / 10)
            ORDER BY
                date_trunc('hour', recorded_at)
                    + INTERVAL '10 minutes'
                    * FLOOR(EXTRACT(MINUTE FROM recorded_at) / 10)
            """
            params = (days,)
        with connection.cursor() as cursor:
            cursor.execute(query,params)
            history = cursor.fetchall()
        
        return history

    except psycopg.Error as error:
        print(f"Database Error {error}")
        return None
    finally:
        if connection:
            connection.close()