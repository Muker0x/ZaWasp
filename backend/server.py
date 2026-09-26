from datetime import datetime


from flask import Flask , request , jsonify
from flask_cors import CORS

from database import insert_device , get_devices , insert_resource_history , get_resource_history
from api_validate import validate

app = Flask(__name__)
CORS(app)
@app.route("/api/devices", methods=["POST"])
def receive_data():
    data = request.json
    print("RECEIVED DEVICE DATA")
    valid , error = validate(data)
    if not valid:
        return jsonify({
            "success": False, 
            "message": error 
        }),400

    if not insert_device(data):
        return jsonify({
            "success": False,
            "message":"Database Error"
        }),500

    if not insert_resource_history(data):
        return jsonify({
            "success": False,
            "message":"Resource history database error"
        }),500

    return jsonify({
        "success": True,
        "message": "Device received successfully"
    }),200

@app.route("/api/devices", methods=["GET"])
def get_all_devices():
    devices = get_devices()

    if devices is None:
        return jsonify({
            "success": False,
            "message":"Database error"
        }),500 
    devices_data = []
    
    for device in devices:
        last_seen = device[7]
        current_time = datetime.now()
        time_difference = (current_time - last_seen).total_seconds()
        if time_difference <= 60:
            device_status = "Online"
        else:
            device_status = "Offline"

        devices_data.append({
            "device_id": device[0],
            "hostname": device[1],
            "system": device[2],
            "username": device[3],
            "ip_address": device[4],
            "cpu_usage": device[5],
            "ram_usage": device[6],
            "last_seen": device[7],
            "status": device_status
        })

    return jsonify({
        "success": True,
        "devices":devices_data
    }),200
@app.route("/api/resources",methods=["GET"])
def get_all_resource_history():
    days = request.args.get("days",type=int)
    history = get_resource_history(days=days)

    if history is None:
        return jsonify({
            "success": False,
            "message": "Database error"
        }),500

    
    history_data = []
    
    for row in history:
        history_data.append({
            "cpu_usage": row[0],
            "ram_usage": row[1],
            "recorded_at": row[2]

        })
    return jsonify({
        "success": True,
        "history": history_data
    }),200

@app.route("/api/devices/<device_id>/resources",methods=["GET"])
def get_device_resource_history(device_id):
    days = request.args.get("days",type=int)
    history = get_resource_history(device_id,days)

    if history is None:
        return jsonify({
            "success": False,
            "message": "Database error"
        }),500

    
    history_data = []
    
    for row in history:
        history_data.append({
            "device_id": row[0],
            "cpu_usage": row[1],
            "ram_usage": row[2],
            "recorded_at": row[3]

        })
    return jsonify({
        "success": True,
        "history": history_data
    }),200

if __name__ == "__main__":
    app.run(debug=True)
    