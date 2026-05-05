from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import requests

app = Flask(__name__)
CORS(app)

# 🔹 Load ML model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(BASE_DIR, "risk_model.pkl"))


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        print("📥 Received:", data)

        if "userId" not in data:
            return jsonify({"error": "userId missing"}), 400

        # =====================================================
        # 🔮 ML PREDICTION
        # =====================================================
        features = [[
            int(data["publicProfile"]),
            int(data["locationSharing"]),
            int(data["thirdPartyApps"]),
            int(data["passwordStrength"] == "weak"),
            int(not data["twoFactorAuth"]),
            int(data["publicWifiUsage"]),
            int(not data["deviceEncrypted"]),
            int(not data["autoUpdates"])
        ]]

        pred = model.predict(features)[0]
        levels = ["Low", "Medium", "High"]
        ml_risk = levels[pred]

        # =====================================================
        # 🔗 CALL NODE MODULES
        # =====================================================
        user_res = requests.post(
            "http://127.0.0.1:5000/api/user-risk",
            json=data
        ).json()

        website_res = requests.post(
            "http://127.0.0.1:5000/api/website-risk",
            json={"url": data.get("url")}
        ).json()

        user_score = min(100, user_res.get("riskScore", 0))
        website_score = min(100, website_res.get("websiteRiskScore", 0))
        cautionx = website_res.get("issues", [])



        print("🧠 User Score:", user_score)
        print("🌐 Website Score:", website_score)

        # =====================================================
        # ⚡ BASE FUSION
        # =====================================================
        ml_score_map = {"Low": 20, "Medium": 50, "High": 80}
        ml_score = ml_score_map[ml_risk]

        risk_score = (
            0.40 * user_score +
            0.45 * website_score +
            0.15 * ml_score
        )

        # =====================================================
        # 🔥 AMPLIFICATION
        # =====================================================
        if website_score >= 50:
            risk_score += 15

        if user_score >= 60:
            risk_score += 10

        if website_score >= 40 and user_score >= 40:
            risk_score += 10

        # =====================================================
        # 🚨 MULTIPLIER
        # =====================================================
        if website_score >= 60:
            risk_score *= 1.25

        if user_score >= 70:
            risk_score *= 1.2

        if website_score >= 60 and user_score >= 60:
            risk_score *= 1.3

        # Clamp
        risk_score = int(max(0, min(100, risk_score)))

        # =====================================================
        # 📊 FINAL LEVEL
        # =====================================================
        if risk_score < 30:
            final_risk = "Low"
        elif risk_score < 60:
            final_risk = "Medium"
        else:
            final_risk = "High"

        # =====================================================
        # 🔥 WEBSITE CAUTIONS (FIXED)
        # =====================================================
        cautions = []

        if website_score >= 70:
            cautions.append("🚨 Highly suspicious website. Avoid entering sensitive data.")
        elif website_score >= 50:
            cautions.append("⚠️ This website may be unsafe. Proceed with caution.")

        for issue in website_res.get("issues", []):
            issue_lower = issue.lower()

            if "keyword" in issue_lower:
                cautions.append("Suspicious domain detected — possible phishing.")
            elif "https" in issue_lower:
                cautions.append("Website is not secure (no HTTPS).")
            elif "headers" in issue_lower:
                cautions.append("Website lacks proper security protections.")
            elif "ip address" in issue_lower:
                cautions.append("🚨+Using IP address instead of domain — high risk.")

        # =====================================================
        # 📦 TWIN DATA
        # =====================================================
        twin_data = {
    "userId": data["userId"],

    "name": data.get("name", "Extension User"),
    "email": data.get("email", "extension@user.com"),

    "websiteURL": data.get("url", "unknown"),

    # 🌐 Website Scan
    "websiteScan": website_res,

    # 👤 User factors (ADD THESE BACK)
    "publicProfile": bool(data["publicProfile"]),
    "locationSharing": bool(data["locationSharing"]),
    "thirdPartyApps": data["thirdPartyApps"],

    "passwordStrength": data["passwordStrength"],
    "twoFactorAuth": data["twoFactorAuth"],

    "publicWifiUsage": data["publicWifiUsage"],
    "deviceEncrypted": data["deviceEncrypted"],
    "autoUpdates": data["autoUpdates"],

    # 📊 Scores
    "riskScore": risk_score,
    "riskLevel": final_risk,
    "suggestions": user_res.get("suggestions", []),
}

        # =====================================================
        # 🔗 SAVE TO NODE
        # =====================================================
        try:
            res = requests.post(
                "http://127.0.0.1:5000/api/twins/from-extension",
                json=twin_data
            )
            print("✅ Saved:", res.status_code)
        except Exception as e:
            print("❌ Node error:", e)

        # =====================================================
        # 📤 RESPONSE
        # =====================================================
        return jsonify({
            "mlRiskLevel": ml_risk,
            "finalRiskLevel": final_risk,
            "riskScore": risk_score,
            "cautions": cautionx,
            "lolscore": website_score
        })

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": str(e)}), 400


@app.route("/")
def home():
    return "Privacy API is running"


if __name__ == "__main__":
    app.run(port=8000, debug=True)