from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)
model = joblib.load("risk_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

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

    return jsonify({
        "mlRiskLevel": levels[pred]
    })

if __name__ == "__main__":
    app.run(port=8000)
