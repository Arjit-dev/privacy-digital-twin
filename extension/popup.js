let isLogin = true;

const authSection = document.getElementById("authSection");
const setupSection = document.getElementById("setupSection");

const actionBtn = document.getElementById("actionBtn");
const toggleMode = document.getElementById("toggleMode");
const title = document.getElementById("title");
const status = document.getElementById("status");

// 🔹 Decode JWT
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

// 🔹 Show sections
function showSetup() {
    authSection.style.display = "none";
    setupSection.style.display = "block";
}

function showLogin() {
    authSection.style.display = "block";
    setupSection.style.display = "none";
}

// 🔥 SHOW RISK
function showRisk() {
    chrome.storage.local.get(["latestRisk", "latestScore"], (res) => {

        if (res.latestRisk) {
            document.getElementById("setupStatus").innerHTML = `
                <div style="margin-top:10px;">
                    🔥 Risk Level: <b>${res.latestRisk}</b><br>
                    📊 Score: <b>${res.latestScore}</b>
                </div>
            `;
        }
    });
}

// 🔹 Toggle login/signup
toggleMode.addEventListener("click", () => {
    isLogin = !isLogin;

    title.textContent = isLogin ? "Login" : "Signup";
    actionBtn.textContent = isLogin ? "Login" : "Signup";
});

// 🔹 LOGIN / SIGNUP
actionBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const endpoint = isLogin ? "login" : "signup";

    try {
        const res = await fetch(`http://127.0.0.1:5000/api/auth/${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        console.log("Auth response:", data);

        // ✅ LOGIN
        if (isLogin && data.token) {

            chrome.storage.local.set({ token: data.token }, () => {
                console.log("Token stored");
            });

            status.textContent = "Login success";

            showSetup();   // 👈 ONLY UI change

        }

        // ✅ SIGNUP
        else if (!isLogin && data.message) {

            status.textContent = "Signup done, now login";

            isLogin = true;
        }

        else {
            status.textContent = data.error || "Error";
        }

    } catch (err) {
        console.log(err);
        status.textContent = "Server error";
    }
});
// 🔹 SAVE PROFILE
document.getElementById("saveProfile").addEventListener("click", async () => {

    const token = await new Promise(resolve =>
        chrome.storage.local.get(["token"], res => resolve(res.token))
    );

    const decoded = parseJwt(token);
    const userId = decoded?.userId;
    console.log("👤 userId:", userId);

    const profile = {
        userId,
        publicProfile: document.getElementById("publicProfile").checked,
        locationSharing: document.getElementById("locationSharing").checked,
        twoFactorAuth: document.getElementById("twoFactorAuth").checked,
        publicWifiUsage: document.getElementById("publicWifiUsage").checked,
        deviceEncrypted: document.getElementById("deviceEncrypted").checked,
        autoUpdates: document.getElementById("autoUpdates").checked,
        thirdPartyApps: parseInt(document.getElementById("thirdPartyApps").value) || 0,
        passwordStrength: document.getElementById("passwordStrength").value
    };

    await fetch("http://127.0.0.1:5000/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
    });

    document.getElementById("setupStatus").textContent = "✅ Profile saved!";
});

// 🔹 LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
    chrome.storage.local.remove("token", () => {
        location.reload();
    });
});

// 🔹 ON LOAD
window.onload = async () => {

    chrome.storage.local.get(["token"], async (res) => {

        if (!res.token) {
            showLogin();
            return;
        }

        showSetup();
        showRisk();  // 🔥 THIS IS KEY
    });
};