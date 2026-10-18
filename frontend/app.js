const API_BASE = "http://localhost:3001/api";

const roleSelect = document.getElementById("role");
const result = document.getElementById("result");
const networkStatus = document.getElementById("networkStatus");

function getRole() {
    return roleSelect.value;
}

function headers() {
    return {
        "Content-Type": "application/json",
        "X-Role": getRole()
    };
}

function showResult(data) {
    result.textContent = JSON.stringify(data, null, 2);
}

function showMessage(message) {
    const box = document.getElementById("message");

    box.textContent = message;
    box.style.display = "block";

    setTimeout(() => {
        box.style.display = "none";
    }, 2500);
}

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);

        const data = await response.json();

        showResult(data);

        if (!response.ok) {
            showMessage("Request failed: " + response.status);
            return null;
        }

        showMessage("Operation successful");
        return data;

    } catch (error) {
        showResult({
            success: false,
            error: error.message
        });

        showMessage("Backend connection failed");
        return null;
    }
}

async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();

        if (data.success) {
            networkStatus.textContent = "Connected";
            networkStatus.style.color = "#16a34a";
        } else {
            networkStatus.textContent = "Error";
        }

    } catch (error) {
        networkStatus.textContent = "Offline";
        networkStatus.style.color = "#dc2626";
    }
}

function getPaymentId() {
    const id = document.getElementById("paymentId").value.trim();

    if (!id) {
        showMessage("Enter a Payment ID");
        return null;
    }

    return id;
}

async function createPayment() {

    if (getRole() !== "government") {
        showMessage("Only Government can issue payments");
        return;
    }

    const paymentId = getPaymentId();

    if (!paymentId) return;

    const data = {
        paymentId: paymentId,
        purpose: document.getElementById("purpose").value.trim(),
        amount: Number(document.getElementById("amount").value),
        issuer: document.getElementById("issuer").value.trim(),
        beneficiaryRef: document.getElementById("beneficiaryRef").value.trim(),
        merchantId: document.getElementById("merchantId").value.trim(),
        merchantName: document.getElementById("merchantName").value.trim(),
        expiryDate: document.getElementById("expiryDate").value,
        notes: "Created through e-RUPI Audit Dashboard"
    };

    const resultData = await apiRequest(`${API_BASE}/payments`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(data)
    });

    if (resultData && resultData.success) {
        updateStatus("ISSUED");
    }
}

async function verifyPayment() {

    if (getRole() !== "bank") {
        showMessage("Only Bank can verify payments");
        return;
    }

    const paymentId = getPaymentId();

    if (!paymentId) return;

    const bankRef = prompt("Enter Bank Reference:");

    if (!bankRef) return;

    const resultData = await apiRequest(
        `${API_BASE}/payments/${encodeURIComponent(paymentId)}/verify`,
        {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify({
                bankRef: bankRef,
                remarks: "Verified through audit dashboard"
            })
        }
    );

    if (resultData && resultData.success) {
        updateStatus("VERIFIED");
    }
}

async function redeemPayment() {

    if (getRole() !== "merchant") {
        showMessage("Only Merchant can redeem payments");
        return;
    }

    const paymentId = getPaymentId();

    if (!paymentId) return;

    const merchantId =
        document.getElementById("merchantId").value.trim();

    if (!merchantId) {
        showMessage("Enter Merchant ID");
        return;
    }

    const locationRef = prompt("Enter Store / Location Reference:");

    if (!locationRef) return;

    const resultData = await apiRequest(
        `${API_BASE}/payments/${encodeURIComponent(paymentId)}/redeem`,
        {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify({
                merchantId: merchantId,
                locationRef: locationRef
            })
        }
    );

    if (resultData && resultData.success) {
        updateStatus("REDEEMED");
    }
}

async function settlePayment() {

    if (getRole() !== "bank") {
        showMessage("Only Bank can settle payments");
        return;
    }

    const paymentId = getPaymentId();

    if (!paymentId) return;

    const settlementRef = prompt("Enter Settlement Reference:");

    if (!settlementRef) return;

    const resultData = await apiRequest(
        `${API_BASE}/payments/${encodeURIComponent(paymentId)}/settle`,
        {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify({
                bankSettlementRef: settlementRef
            })
        }
    );

    if (resultData && resultData.success) {
        updateStatus("SETTLED");
    }
}

async function getPayment() {

    const paymentId = getPaymentId();

    if (!paymentId) return;

    const data = await apiRequest(
        `${API_BASE}/payments/${encodeURIComponent(paymentId)}`,
        {
            method: "GET",
            headers: headers()
        }
    );

    if (data && data.success && data.data) {
        const status = String(data.data.status).trim().toUpperCase();

        console.log("Payment status:", status);

        updateStatus(status);
    }
}

async function getHistory() {

    const paymentId = getPaymentId();

    if (!paymentId) return;

    await apiRequest(
        `${API_BASE}/payments/${encodeURIComponent(paymentId)}/history`,
        {
            method: "GET",
            headers: headers()
        }
    );
}

function updateStatus(status) {

    const statuses = [
        "statusIssued",
        "statusVerified",
        "statusRedeemed",
        "statusSettled"
    ];

    const order = [
        "ISSUED",
        "VERIFIED",
        "REDEEMED",
        "SETTLED"
    ];

    statuses.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.classList.remove("active", "current");
        }
    });

    const index = order.indexOf(status);

    if (index === -1) return;

    for (let i = 0; i <= index; i++) {
        const element = document.getElementById(statuses[i]);

        if (element) {
            element.classList.add("active");
        }
    }

    const currentElement = document.getElementById(statuses[index]);

    if (currentElement) {
        currentElement.classList.add("current");
    }
}

roleSelect.addEventListener("change", () => {
    showMessage("Role changed to " + getRole());
});

checkHealth();
