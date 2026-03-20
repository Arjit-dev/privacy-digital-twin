console.log("Content script loaded");

// Prevent duplicate popups
let popupExists = false;

// 🔍 Analyze form fields
function analyzeForm() {
    let inputs = document.querySelectorAll("input");

    let hasPassword = false;
    let hasEmail = false;

    inputs.forEach(input => {
        if (input.type === "password") hasPassword = true;
        if (input.type === "email") hasEmail = true;
    });

    return {
        hasPassword,
        hasEmail,
        totalFields: inputs.length
    };
}


// 🎯 Main Popup Function
function showPopup(siteRisk, userRisk) {

    if (popupExists) return;
    popupExists = true;

    let formData = analyzeForm();

    // 🎨 Color + Title Logic
    let bgColor = "#2ecc71";
    let title = "✅ Safe Website";

    if (siteRisk === "High") {
        bgColor = "#e74c3c";
        title = "⚠️ Unsafe Website";
    }
    else if (formData.hasPassword && siteRisk === "High") {
        bgColor = "#e74c3c";
        title = "❌ Dangerous Login Page";
    }
    else if (formData.hasPassword) {
        bgColor = "#f39c12";
        title = "⚠️ Login Page Detected";
    }
    else if (userRisk === "High") {
        bgColor = "#f39c12";
        title = "⚠️ Risky User Behavior";
    }
    else if (userRisk === "Medium") {
        bgColor = "#f39c12";
        title = "⚠️ Medium Risk";
    }

    // 🧠 Smart Warning Message
    let warning = "";

    if (formData.hasPassword && siteRisk === "High") {
        warning = "❌ Do NOT enter password on insecure site!";
    }
    else if (formData.hasPassword) {
        warning = "🔐 This page asks for sensitive credentials";
    }
    else if (userRisk === "High") {
        warning = "⚠️ Your current settings expose you to risk";
    }
    else {
        warning = "✔ No major risks detected";
    }

    // 📊 Dynamic risk score
    let score = 30;
    if (userRisk === "High") score = 80;
    else if (userRisk === "Medium") score = 50;

    let box = document.createElement("div");

    box.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            z-index: 9999;
            width: 270px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.4s ease;
        ">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                ${title}
            </div>

            <div style="font-size: 14px;">
                🌐 Site Risk: <b>${siteRisk}</b><br/>
                👤 User Risk: <b>${userRisk}</b>
            </div>

            <div style="margin-top: 8px; font-size: 13px;">
                💡 ${warning}
            </div>

            <div style="margin-top: 10px;">
                <div style="background:#ddd; border-radius:5px;">
                    <div style="
                        width:${score}%;
                        background:white;
                        height:8px;
                        border-radius:5px;
                    "></div>
                </div>
            </div>

            <button id="closePopup" style="
                margin-top: 10px;
                padding: 5px 10px;
                border: none;
                background: white;
                color: black;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
            ">
                Close
            </button>
        </div>

        <style>
            @keyframes slideIn {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
        </style>
    `;

    document.body.appendChild(box);

    // ❌ Close button
    box.querySelector("#closePopup").addEventListener("click", () => {
        box.remove();
        popupExists = false;
    });

    // ⏱ Auto remove
    setTimeout(() => {
        box.remove();
        popupExists = false;
    }, 5000);
}


// 📩 Listen from background
chrome.runtime.onMessage.addListener((message) => {
    console.log("📩 Message received in content:", message);

    // ✅ DO NOT override user risk anymore
    showPopup(message.siteRisk, message.userRisk);
});