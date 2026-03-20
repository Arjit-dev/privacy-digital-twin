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
        print("📥 Received from Extension:", data)

        # 🔥 VALIDATE userId
        if "userId" not in data:
            return jsonify({"error": "userId missing"}), 400

        print("🔥 FINAL userId going to Node:", data["userId"])

        # 🔹 Feature extraction
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

        # 🔮 ML Prediction
        pred = model.predict(features)[0]
        levels = ["Low", "Medium", "High"]
        ml_risk = levels[pred]

        # =========================================================
        # 🔥 HYBRID MULTI-FACTOR RISK ADJUSTMENT (NEW - SAFE ADDITION)
        # =========================================================

        risk_points = 0

        # 🔹 Third-party apps
        if data["thirdPartyApps"] > 25:
            risk_points += 2
        elif data["thirdPartyApps"] > 15:
            risk_points += 1

        # 🔹 Password strength
        if data["passwordStrength"] == "weak":
            risk_points += 1

        # 🔹 No 2FA
        if not data["twoFactorAuth"]:
            risk_points += 1

        # 🔹 Public profile
        if data["publicProfile"]:
            risk_points += 1

        # 🔹 Location sharing
        if data["locationSharing"]:
            risk_points += 1

        # 🔹 Public WiFi usage
        if data["publicWifiUsage"]:
            risk_points += 1

        # 🔹 Device security
        if not data["deviceEncrypted"]:
            risk_points += 1

        # 🔹 No auto updates
        if not data["autoUpdates"]:
            risk_points += 1

        # 🔥 Adjust ML result (refinement, not replacement)
        if risk_points >= 4:
            ml_risk = "High"
            pred = max(pred, 2)
        elif risk_points >= 2:
            if ml_risk == "Low":
                ml_risk = "Medium"
                pred = max(pred, 1)

        # =========================================================

        # 🌐 Site Risk
        site_risk = data.get("siteRisk", "Low")

        # 🔥 FINAL RISK
        if site_risk == "High" or ml_risk == "High":
            final_risk = "High"
        elif site_risk == "Medium" or ml_risk == "Medium":
            final_risk = "Medium"
        else:
            final_risk = "Low"

        # 🔥 Risk Score
        risk_score = int(pred * 30 + 20)

        if site_risk == "High":
            risk_score += 30
        elif site_risk == "Medium":
            risk_score += 15

        risk_score = max(0, min(100, risk_score))

        # 🔹 Create twin data
        twin_data = {
            "userId": data["userId"],

            "name": data.get("name", "Extension User"),
            "email": data.get("email", "extension@user.com"),

            "websiteURL": data.get("url", "unknown"),

            "websiteScan": {
                "websiteRiskScore": 50,
                "websiteRiskLevel": site_risk,
                "issues": []
            },

            "publicProfile": bool(data["publicProfile"]),
            "locationSharing": bool(data["locationSharing"]),
            "thirdPartyApps": data["thirdPartyApps"],

            "passwordStrength": data["passwordStrength"],
            "twoFactorAuth": data["twoFactorAuth"],

            "publicWifiUsage": data["publicWifiUsage"],
            "deviceEncrypted": data["deviceEncrypted"],
            "autoUpdates": data["autoUpdates"],

            "riskScore": risk_score,
            "riskLevel": final_risk
        }

        # 🔗 Send to Node backend
        try:
            res = requests.post(
                "http://127.0.0.1:5000/api/twins/from-extension",
                json=twin_data
            )
            print("✅ Sent to Node:", res.status_code)
        except Exception as e:
            print("❌ Node error:", e)

        # 📤 Response
        return jsonify({
            "mlRiskLevel": ml_risk,
            "finalRiskLevel": final_risk,
            "riskScore": risk_score
        })

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"error": str(e)}), 400


@app.route("/")
def home():
    return "Privacy API is running"


if __name__ == "__main__":
    app.run(port=8000, debug=True)