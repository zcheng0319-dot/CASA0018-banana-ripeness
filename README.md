# 🍌 Banana Ripeness Classifier (CASA0018)

## 📌 Overview

This project develops a machine learning model to classify banana ripeness into four categories:

* Unripe
* Ripe
* Overripe
* Rotten

The model is built using Edge Impulse and will be deployed to a mobile web application.

---

## ⚙️ Methodology

### 1. Data Collection

Images of bananas were collected and organized into four categories.

### 2. Data Labeling

All images were labeled manually into:

* unripe
* ripe
* overripe
* rotten

### 3. Model Training

* Platform: Edge Impulse
* Input: Image (96 × 96)
* Model: Neural Network classifier

### 4. Feature Extraction

Image processing block used for feature generation.

---

## 📊 Results

* Validation Accuracy: **~90%**
* Test Accuracy: **97.11%**
* Strong classification performance across all categories
* Minor confusion between "ripe" and "under-ripe"

---

## 📸 Screenshots

See `/screenshots` folder for:

* Training results
* Model testing output
* Confusion matrix

---

## 📱 Future Work

* Deploy model to a mobile web application
* Enable real-time camera-based banana classification

---

## 🛠️ Tools Used

* Edge Impulse
* TensorFlow Lite
* JavaScript (for deployment)

---
