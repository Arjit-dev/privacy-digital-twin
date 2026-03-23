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
    <div class="pt-popup">
        <div class="pt-title">${title}</div>

        <div class="pt-risk">
            <div>🌐 <span>Site Risk:</span> <b class="site">${siteRisk}</b></div>
            <div>👤 <span>User Risk:</span> <b class="user">${userRisk}</b></div>
        </div>

        <div class="pt-warning">
            ${warning}
        </div>

        <div class="pt-bar">
            <div class="pt-fill" style="width:${score}%"></div>
        </div>
        <button id="closePopup" class="pt-btn">Close</button>
        <div class="pt-link" id="openDashboard">
    🔍 <span>More insights available</span><br/>
    <span class="pt-link-action">Visit dashboard →</span>
</div>
    </div>

    <style>
        .pt-popup {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            padding: 16px;
            border-radius: 16px;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 9999;

            background: #0f172a;
            color: #fff;

            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            animation: ptSlide 0.3s ease;
        }

        .pt-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .pt-risk {
            font-size: 13px;
            opacity: 0.9;
            margin-bottom: 10px;
            line-height: 1.6;
        }

        .pt-risk span {
            opacity: 0.7;
        }

        .pt-risk .site {
            color: ${siteRisk === "High" ? "#ef4444" : "#22c55e"};
        }

        .pt-risk .user {
            color: ${
                userRisk === "High"
                    ? "#ef4444"
                    : userRisk === "Medium"
                    ? "#facc15"
                    : "#22c55e"
            };
        }

        .pt-warning {
            background: #020617;
            padding: 10px;
            border-radius: 10px;
            font-size: 13px;
            margin-bottom: 12px;
        }

        .pt-bar {
            height: 6px;
            background: rgba(255,255,255,0.1);
            border-radius: 999px;
            overflow: hidden;
            margin-bottom: 12px;
        }

        .pt-fill {
            height: 100%;
            border-radius: 999px;
            background: ${
                score > 70 ? "#ef4444" : score > 40 ? "#facc15" : "#22c55e"
            };
            transition: width 0.4s ease;
        }

        .pt-btn {
            width: 100%;
            padding: 8px;
            border-radius: 10px;
            border: none;
            background: rgba(255,255,255,0.1);
            color: white;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
        }

        .pt-btn:hover {
            background: rgba(255,255,255,0.2);
        }
            .pt-link {
    font-size: 12px;
    opacity: 0.8;
    margin-bottom: 10px;
}
.pt-link {
    font-size: 12px;
    margin-bottom: 12px;
    line-height: 1.4;
}

.pt-link span:first-child {
    opacity: 0.7;
}

.pt-link-action {
    color: #38bdf8;
    font-weight: 600;
    cursor: pointer;
    display: inline-block;
    margin-top: 2px;
}

.pt-link-action:hover {
    text-decoration: underline;
}

        @keyframes ptSlide {
            from {
                transform: translateY(20px);
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

    box.querySelector("#openDashboard").addEventListener("click", () => {
    window.open("http://localhost:5173", "_blank");
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