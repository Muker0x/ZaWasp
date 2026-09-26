import uuid


def validate(data):
    required_fields = [
        "device_id",
        "hostname",
        "system",
        "username",
        "ip_address",
        "ram_usage",
        "cpu_usage",
    ]

    string_fields = [
        "device_id",
        "hostname",
        "system",
        "username",
        "ip_address",
    ]

    numeric_fields = [
        "ram_usage",
        "cpu_usage",
    ]

    if data is None:
        return False, "Request must contain JSON"

    for field in required_fields:
        if field not in data:
            return False, f"Missing field {field}"

    if not all(
        isinstance(data[field], str)
        for field in string_fields
    ):
        return False, "Value type is not expected"

    try:
        uuid.UUID(data["device_id"])
    except ValueError:
        return False, "Invalid device_id"

    if not all(
        isinstance(data[field], (int, float))
        for field in numeric_fields
    ):
        return False, "Value type is not expected"

    if not 0 <= data["cpu_usage"] <= 100:
        return False, "CPU usage must be between 0 and 100"

    if not 0 <= data["ram_usage"] <= 100:
        return False, "RAM usage must be between 0 and 100"

    return True, None