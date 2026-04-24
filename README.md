# 🍌 Banana Ripeness Classifier (CASA0018)

This project develops a browser-based machine learning system for classifying banana ripeness using **Edge Impulse**, **image classification**, and **WebAssembly deployment**.

The system uses a trained image classification model to identify whether a banana is:

- `unripe`
- `ripe`
- `overripe`
- `rotten`

The final prototype runs in a web browser and is designed to work on both desktop and mobile devices.

---

## 🌐 Live Demo

The web demo is deployed using **GitHub Pages**:

https://zcheng0319-dot.github.io/CASA0018-banana-ripeness/

---

## 📌 Project Overview

The aim of this project is to explore how machine learning can be deployed locally on an edge device, rather than only running in the cloud. A mobile phone camera is used as the sensing input, while the trained Edge Impulse model runs inside the browser.

The project follows a complete edge AI workflow:

1. Collect and organise banana image data
2. Label images into ripeness categories
3. Train an image classification model in Edge Impulse
4. Test model performance using validation and test data
5. Export the model as a WebAssembly browser deployment
6. Build a custom web interface for user interaction and feedback

---

## 🎯 Project Goal

The goal is to create a simple but practical prototype that helps users quickly judge banana ripeness. Instead of only showing raw model output, the web interface presents the prediction in a more user-friendly way, including:

- predicted class
- confidence score
- per-class probabilities
- visual feedback through colour changes
- optional physical feedback through vibration on supported mobile devices

This makes the project closer to a small consumer-facing prototype rather than a basic technical demo.

---

## 🧠 Machine Learning Model

The model was trained using **Edge Impulse Studio**.

### Model Type

- Image classification
- Neural network classifier
- Browser deployment using WebAssembly

### Input

- Image input
- Processed as `96 × 96` image data

### Classes

| Class | Meaning |
|---|---|
| `unripe` | Green or not ready to eat |
| `ripe` | Ready to eat |
| `overripe` | Very mature, best used soon |
| `rotten` | No longer suitable for eating |

---

## 📊 Model Performance

The model achieved strong testing performance after training and refinement.

- Validation accuracy: approximately **90%**
- Model testing accuracy: approximately **95%+**
- The model performs well across the four banana ripeness categories
- Some confusion can still occur between visually similar stages, especially where lighting, colour, and texture are ambiguous

This limitation is expected because banana ripeness changes gradually rather than through clear visual boundaries.

---

## 🧪 Dataset and Labelling

Banana images were organised into four categories:

- `unripe`
- `ripe`
- `overripe`
- `rotten`

The dataset included images with different appearances, colours, and ripeness stages. The class structure was refined during the project by introducing the `rotten` category to better represent real-world banana conditions.

This helped make the model more realistic for practical use.

---

## 🌐 Web Application: BananaPulse Web

The browser-based application is called **BananaPulse Web**.

It provides a mobile-friendly interface for using the trained banana ripeness model.

### Main features

- Landing page and scanning page
- Camera mode for live testing
- Upload mode for banana image testing
- Real-time prediction display
- Confidence score and class probability display
- Colour-based visual feedback
- Optional vibration feedback on supported mobile devices
- Responsive layout for desktop and mobile browsers

More details can be found in the web app documentation inside the project files.

---

### Folder explanation

- `Project-Idea`  
  Contains the early project idea and label definitions.

- `screenshots/`  
  Contains screenshots of the Edge Impulse dataset, model training, testing results, and web demo.

- `web/browser/`  
  Development version of the BananaPulse web application.

- `docs/`  
  GitHub Pages deployment version of the web application.

---

## ⚙️ Tools and Technologies

- Edge Impulse
- TensorFlow Lite / WebAssembly deployment
- HTML
- CSS
- JavaScript
- GitHub Pages
- Mobile phone camera as sensing input

---

## 🚀 Running Locally

To run the web version locally, open a terminal inside the local web app folder and run:

```bash
python server.py
```

Then open:

```text
http://localhost:8082
```

The local server is needed because the browser must load the WebAssembly model files correctly.

---

## 📱 Deployment

The project is deployed using **GitHub Pages**.

Live site:

```text
https://zcheng0319-dot.github.io/CASA0018-banana-ripeness/
```

The deployment version is stored in the `docs/` folder because GitHub Pages is configured to build from:

```text
main / docs
```

---

## 📸 Screenshots

The `screenshots/` folder includes evidence of:

- dataset upload and labelling
- model training
- confusion matrix
- model testing
- deployment process
- web interface testing

These screenshots are included to document the full development process.

---

## 🔍 Reflection

A key challenge in this project was connecting the trained model to the browser interface. The Edge Impulse model was exported as a WebAssembly deployment, but the front-end still needed to preprocess image input correctly before sending it to the classifier.

Another important part of the project was improving the user interface so that the system feels more like a usable application. Instead of only returning technical prediction values, the final web app gives clearer visual feedback and user-facing results.

---

## 🔮 Future Improvements

Possible future improvements include:

- improving mobile camera compatibility across different browsers
- expanding the dataset with more real-world banana images
- adding scan history
- adding clearer eating recommendations
- improving classification under difficult lighting conditions
- testing the system with more banana varieties

---

## 👤 Author

Created by Cheng Zhong as part of the **CASA0018** coursework project.
