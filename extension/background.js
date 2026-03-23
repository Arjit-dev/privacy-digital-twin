console.log("Background script started");

let lastAlertTime = 0;

// 🔹 Get token
function getToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["token"], (res) => {
            resolve(res.token);
        });
    });
}

// 🔹 Decode JWT
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

// 🔹 Fetch profile
async function getUserProfile(userId) {
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/profile/${userId}`);
        const data = await res.json();

        console.log("📦 Profile fetched:", data);

        return data;
    } catch (err) {
        console.log("❌ Profile fetch error:", err);
        return null;
    }
}

// 🔹 Site risk
function calculateSiteRisk(url) {
    if (!url.startsWith("http")) return "Unknown";

    let score = 0;

    if (url.startsWith("http://")) score += 50;
    if (url.includes("login") || url.includes("verify")) score += 25;
    if (url.length > 120) score += 15;

    if (score >= 60) return "High";
    if (score >= 30) return "Medium";
    return "Low";
}
chrome.commands.onCommand.addListener((command) => {
    if (command === "open-popup") {
        chrome.action.openPopup();
    }
});

// 🔥 MAIN FLOW
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    if (changeInfo.status === "complete" && tab.url) {

        const token = await getToken();
        if (!token) return;

        const decoded = parseJwt(token);
        const userId = decoded?.userId;

        if (!userId) return;

        const url = tab.url;
        const siteRisk = calculateSiteRisk(url);

        const profile = await getUserProfile(userId);

        if (!profile) return;

        const data = {
            userId,
            url,
            siteRisk,

            publicProfile: profile.publicProfile,
            locationSharing: profile.locationSharing,
            thirdPartyApps: profile.thirdPartyApps,
            passwordStrength: profile.passwordStrength,
            twoFactorAuth: profile.twoFactorAuth,
            publicWifiUsage: profile.publicWifiUsage,
            deviceEncrypted: profile.deviceEncrypted,
            autoUpdates: profile.autoUpdates
        };

        console.log("📤 Sending data:", data);

        fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(res => {

            console.log("✅ API Response:", res);

            // 🔥 STORE RESULT FOR POPUP
            chrome.storage.local.set({
                latestRisk: res.finalRiskLevel,
                latestScore: res.riskScore
            });

            if (Date.now() - lastAlertTime > 5000) {

                chrome.tabs.sendMessage(tabId, {
                    siteRisk,
                    userRisk: res.finalRiskLevel,
                    riskScore: res.riskScore
                });

                lastAlertTime = Date.now();
            }

        })
        .catch(err => {
            console.log("❌ API error:", err);
        });
    }
});