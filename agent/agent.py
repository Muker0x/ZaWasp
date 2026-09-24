import sys
import os
import getpass
import socket 
import psutil
import json 
import requests
import uuid
from pathlib import Path
import time
    
SERVER_URL = "http://127.0.0.1:5000"

def get_system_info():
    system = sys.platform
    username = getpass.getuser()
    hostname = socket.gethostname()
    memory_info = psutil.virtual_memory()
    ram_usage = memory_info.percent
    cpu_usage = psutil.cpu_percent(interval=1)
    device_id = get_device_uid()
    ip_address = get_local_ip()
    return {
        "device_id": device_id,
        "hostname":hostname,
        "system": system,
        "username": username,
        "ip_address": ip_address,
        "ram_usage": ram_usage,
        "cpu_usage": cpu_usage

    }
def get_local_ip():
    socket_connection = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    try:
        socket_connection.connect(("8.8.8.8", 80))
        return socket_connection.getsockname()[0]
    finally:
        socket_connection.close()
def send_data(data):
    try:
        response = requests.post(
            f"{SERVER_URL}/api/devices",
            json = data,
            timeout = 5,
        )
        response.raise_for_status()
        return response.status_code, response.json()

    except requests.exceptions.HTTPError as http_error:
        err_status_code = http_error.response.status_code
        return f"HTTP Error {err_status_code}"
    
    except requests.exceptions.ConnectionError: 
        return "Server is down"
    except requests.exceptions.Timeout:
        return "Request timed out "
    


    


def get_device_uid():
        project_root = Path(__file__).resolve().parent.parent
        system_info_path = project_root / "id_config.json"

        if system_info_path.exists():
            with open(system_info_path,"r") as file: 
                data = json.load(file)
            if "device_id" in data:
                return data["device_id"]

        device_id = str(uuid.uuid4())

        with open(system_info_path, "w") as file:
            json.dump({"device_id": device_id}, file, indent=4)
        return device_id



def heartbeat_loop():
    while True:
        system_info_data = get_system_info()
        print(send_data(system_info_data))
        time.sleep(10)
def main():
    heartbeat_loop()

if __name__ == "__main__":
    main() 
