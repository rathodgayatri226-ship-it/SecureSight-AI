from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Simulated device data for project demonstration
devices = [
    {
        "id": "SYS-001",
        "name": "Server-01",
        "cpu": 35,
        "memory": 48,
        "disk": 55,
        "bandwidth": 120,
        "latency": 24,
        "packet_loss": 0,
        "failed_logins": 1
    },
    {
        "id": "SYS-002",
        "name": "Server-02",
        "cpu": 89,
        "memory": 82,
        "disk": 76,
        "bandwidth": 250,
        "latency": 95,
        "packet_loss": 3,
        "failed_logins": 4
    },
    {
        "id": "SYS-003",
        "name": "Database-01",
        "cpu": 42,
        "memory": 60,
        "disk": 65,
        "bandwidth": 180,
        "latency": 35,
        "packet_loss": 0,
        "failed_logins": 0
    },
    {
        "id": "SYS-004",
        "name": "Application-01",
        "cpu": 96,
        "memory": 92,
        "disk": 88,
        "bandwidth": 310,
        "latency": 150,
        "packet_loss": 8,
        "failed_logins": 7
    },
    {
        "id": "SYS-005",
        "name": "Network-01",
        "cpu": 25,
        "memory": 40,
        "disk": 35,
        "bandwidth": 90,
        "latency": 18,
        "packet_loss": 0,
        "failed_logins": 0
    }
]


def get_status(device):
    if (
        device["cpu"] >= 90
        or device["memory"] >= 90
        or device["latency"] >= 120
        or device["packet_loss"] >= 5
    ):
        return "Critical"

    if (
        device["cpu"] >= 75
        or device["memory"] >= 75
        or device["latency"] >= 80
        or device["packet_loss"] >= 2
    ):
        return "Warning"

    return "Healthy"


@app.route("/")
def home():
    return jsonify({
        "message": "SecureSight AI Backend is running",
        "devices": len(devices)
    })


@app.route("/api/devices")
def get_devices():
    result = []

    for device in devices:
        item = device.copy()
        item["status"] = get_status(device)
        result.append(item)

    return jsonify({"devices": result})


@app.route("/api/summary")
def get_summary():
    healthy = sum(
        1 for device in devices
        if get_status(device) == "Healthy"
    )

    warning = sum(
        1 for device in devices
        if get_status(device) == "Warning"
    )

    critical = sum(
        1 for device in devices
        if get_status(device) == "Critical"
    )

    return jsonify({
        "total_devices": len(devices),
        "healthy": healthy,
        "warning": warning,
        "critical": critical,
        "avg_latency": round(
            sum(d["latency"] for d in devices) / len(devices), 2
        ),
        "packet_loss": sum(d["packet_loss"] for d in devices),
        "failed_logins": sum(d["failed_logins"] for d in devices)
    })


@app.route("/api/alerts")
def get_alerts():
    alerts = []

    for device in devices:
        status = get_status(device)

        if status != "Healthy":
            alerts.append({
                "device": device["name"],
                "status": status,
                "message": (
                    "Unusual system activity detected"
                    if status == "Warning"
                    else "Critical system metrics detected"
                )
            })

        if device["failed_logins"] >= 5:
            alerts.append({
                "device": device["name"],
                "status": "Warning",
                "message": "Multiple failed login attempts detected"
            })

    return jsonify({"alerts": alerts})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)