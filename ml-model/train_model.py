import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import numpy as np

# Generate synthetic dataset
data = []

for _ in range(500):
    public_profile = np.random.randint(0, 2)
    location = np.random.randint(0, 2)
    apps = np.random.randint(0, 10)
    weak_password = np.random.randint(0, 2)
    no_2fa = np.random.randint(0, 2)
    public_wifi = np.random.randint(0, 2)
    no_encryption = np.random.randint(0, 2)
    no_updates = np.random.randint(0, 2)

    score = (
        public_profile * 20 +
        location * 15 +
        (apps > 3) * 20 +
        weak_password * 25 +
        no_2fa * 15 +
        public_wifi * 10 +
        no_encryption * 15 +
        no_updates * 10
    )

    if score < 30:
        label = 0
    elif score < 70:
        label = 1
    else:
        label = 2

    data.append([
        public_profile, location, apps, weak_password,
        no_2fa, public_wifi, no_encryption, no_updates, label
    ])

df = pd.DataFrame(data, columns=[
    "public_profile", "location", "apps", "weak_password",
    "no_2fa", "public_wifi", "no_encryption", "no_updates", "label"
])

X = df.drop("label", axis=1)
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = RandomForestClassifier()
model.fit(X_train, y_train)

joblib.dump(model, "risk_model.pkl")

print("Model trained and saved as risk_model.pkl")
