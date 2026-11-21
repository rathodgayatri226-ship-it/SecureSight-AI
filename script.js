const API = "https://securesight-ai-k4td.onrender.com";

// Main dashboard
async function updateDashboard() {
    try {
        const [deviceResponse, summaryResponse, alertResponse] =
            await Promise.all([
                fetch(`${API}/api/devices`),
                fetch(`${API}/api/summary`),
                fetch(`${API}/api/alerts`)
            ]);

        if (!deviceResponse.ok || !summaryResponse.ok ||
            !alertResponse.ok) {
            throw new Error("Backend request failed");
        }

        const deviceData = await deviceResponse.json();
        const summary = await summaryResponse.json();
        const alertData = await alertResponse.json();

        // Last updated timestamp
        const updatedTime = deviceData.updated_at
            ? new Date(deviceData.updated_at).toLocaleString()
            : new Date().toLocaleString();

        const timestampElement = document.getElementById("lastUpdated");

        if (timestampElement) {
            timestampElement.textContent =
                "Last updated: " + updatedTime;
        }

        // Summary cards
        document.getElementById("totalDevices").textContent = summary.total_devices;
        document.getElementById("healthyDevices").textContent = summary.healthy;
        document.getElementById("warningDevices").textContent = summary.warning;
        document.getElementById("criticalDevices").textContent = summary.critical;

        // Device monitoring table
        document.getElementById("deviceTable").innerHTML =
            deviceData.devices.map(device => `
                <tr class="device-row" data-device-id="${device.id}">
                    <td>${device.name}</td>
                    <td>${device.cpu}%</td>
                    <td>${device.memory}%</td>
                    <td>${device.disk}%</td>
                    <td>${device.bandwidth} Mbps</td>
                    <td>${device.latency} ms</td>
                    <td>
                        <span class="status-badge ${device.status.toLowerCase()}">
                            ${device.status}
                        </span>
                    </td>
                </tr>
            `).join("");

        // Make device rows clickable
        document.querySelectorAll(".device-row").forEach(row => {
            row.addEventListener("click", () => {
                const selectedDevice = deviceData.devices.find(
                    device => device.id === row.dataset.deviceId
                );

                if (selectedDevice) {
                    showDeviceDetails(selectedDevice);
                }
            });
        });

        // Network overview
        const avgLatency = deviceData.devices.reduce(
            (sum, device) => sum + device.latency, 0
        ) / deviceData.devices.length;

        const totalPacketLoss = deviceData.devices.reduce(
            (sum, device) => sum + device.packet_loss, 0
        ) / deviceData.devices.length;

        const totalFailedLogins = deviceData.devices.reduce(
            (sum, device) => sum + device.failed_logins, 0
        );

        document.getElementById("avgLatency").textContent =
            avgLatency.toFixed(1) + " ms";

        document.getElementById("packetLoss").textContent =
            totalPacketLoss.toFixed(1) + "%";

        document.getElementById("failedLogins").textContent =
            totalFailedLogins;

        // Security alerts
        document.getElementById("alertList").innerHTML =
            alertData.alerts.map(alert => `
                <div class="alert ${
                    alert.status === "Critical" ? "critical-alert" : ""
                }">
                    <strong>${alert.device} - ${alert.status}</strong>
                    <p>${alert.message}</p>
                </div>
            `).join("") || "<p>No alerts detected.</p>";

        // Performance charts
        updatePerformanceCharts(deviceData.devices);

        // Anomaly detection
        updateAIInsights(deviceData.devices);

    } catch (error) {
        document.getElementById("alertList").innerHTML =
            "<div class='alert critical-alert'>" +
            "<strong>Backend connection failed</strong>" +
            "<p>Start the Python backend and refresh the dashboard.</p>" +
            "</div>";

        console.error("Dashboard error:", error);
    }
}


// Show individual device details
function showDeviceDetails(device) {
    const panel = document.getElementById("deviceDetails");
    const content = document.getElementById("deviceDetailsContent");

    panel.style.display = "block";

    content.innerHTML = `
        <h3>${device.name}</h3>
        <p>Device ID: ${device.id}</p>

        <div class="device-details-grid">

            <div class="device-info-card">
                <p>CPU Usage</p>
                <h3>${device.cpu}%</h3>
            </div>

            <div class="device-info-card">
                <p>Memory Usage</p>
                <h3>${device.memory}%</h3>
            </div>

            <div class="device-info-card">
                <p>Disk Usage</p>
                <h3>${device.disk}%</h3>
            </div>

            <div class="device-info-card">
                <p>Bandwidth</p>
                <h3>${device.bandwidth} Mbps</h3>
            </div>

            <div class="device-info-card">
                <p>Network Latency</p>
                <h3>${device.latency} ms</h3>
            </div>

            <div class="device-info-card">
                <p>Packet Loss</p>
                <h3>${device.packet_loss}%</h3>
            </div>

            <div class="device-info-card">
                <p>Failed Logins</p>
                <h3>${device.failed_logins}</h3>
            </div>

            <div class="device-info-card">
                <p>Device Status</p>
                <h3>${device.status}</h3>
            </div>

        </div>
    `;

    panel.scrollIntoView({ behavior: "smooth" });
}


// CPU and memory performance charts
function updatePerformanceCharts(devices) {
    const container = document.getElementById("performanceCharts");

    if (!container) return;

    container.innerHTML = devices.map(device => {
        const cpuClass = device.cpu >= 90 ? "critical" :
                         device.cpu >= 75 ? "warning" : "";

        const memoryClass = device.memory >= 90 ? "critical" :
                            device.memory >= 75 ? "warning" : "";

        return `
            <div class="performance-card">
                <h3>${device.name}</h3>

                <div class="metric-row">
                    <div class="metric-label">
                        <span>CPU Usage</span>
                        <strong>${device.cpu}%</strong>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${cpuClass}"
                             style="width:${Math.min(device.cpu, 100)}%">
                        </div>
                    </div>
                </div>

                <div class="metric-row">
                    <div class="metric-label">
                        <span>Memory Usage</span>
                        <strong>${device.memory}%</strong>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${memoryClass}"
                             style="width:${Math.min(device.memory, 100)}%">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}


// Rule-based anomaly detection
function updateAIInsights(devices) {
    const container = document.getElementById("aiInsights");

    if (!container) return;

    let insights = [];

    devices.forEach(device => {
        let reasons = [];

        // Critical-level conditions
        if (device.cpu >= 90)
            reasons.push(`Very high CPU usage: ${device.cpu}%`);

        if (device.memory >= 90)
            reasons.push(`Very high memory usage: ${device.memory}%`);

        if (device.latency >= 120)
            reasons.push(`High network latency: ${device.latency} ms`);

        if (device.packet_loss >= 5)
            reasons.push(`High packet loss: ${device.packet_loss}%`);

        // Warning-level conditions
        if (device.cpu >= 75 && device.cpu < 90)
            reasons.push(`Elevated CPU usage: ${device.cpu}%`);

        if (device.memory >= 75 && device.memory < 90)
            reasons.push(`Elevated memory usage: ${device.memory}%`);

        if (device.latency >= 80 && device.latency < 120)
            reasons.push(`Elevated network latency: ${device.latency} ms`);

        if (device.packet_loss >= 2 && device.packet_loss < 5)
            reasons.push(`Packet loss detected: ${device.packet_loss}%`);

        if (device.failed_logins >= 5)
            reasons.push(`Multiple failed login attempts: ${device.failed_logins}`);

        if (reasons.length > 0) {
            const critical = device.status === "Critical";

            insights.push({
                name: device.name,
                level: critical ? "critical" : "warning",
                reasons
            });
        }
    });

    container.innerHTML = insights.length
        ? insights.map(item => `
            <div class="insight-card ${item.level}">
                <h3>${item.name} - ${item.level.toUpperCase()}</h3>
                ${item.reasons.map(reason => `<p>• ${reason}</p>`).join("")}
            </div>
        `).join("")
        : "<p class='insight-normal'>No unusual activity detected.</p>";
}

// Start dashboard
updateDashboard();
setInterval(updateDashboard, 5000);