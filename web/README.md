# BananaPulse Web

BananaPulse Web is a mobile-friendly browser application for **banana ripeness detection**.  
It combines a custom front-end interface with an **Edge Impulse** image classification model running in the browser through **WebAssembly**.

Live demo: https://zcheng0319-dot.github.io/CASA0018-banana-ripeness/

The goal of this project is to help users quickly identify whether a banana is:

- `unripe`
- `ripe`
- `overripe`
- `rotten`

## Features

- Two-page mobile-style experience:
  - Landing page
  - Scanning page
- Banana-themed visual design
- Camera mode for live testing
- Upload mode for testing banana images
- Live prediction display with:
  - predicted class
  - confidence score
  - per-class probabilities
- Browser-based inference using Edge Impulse WebAssembly deployment
- Visual feedback through colour changes
- Optional physical feedback through vibration on supported mobile devices
- Responsive layout for desktop and mobile browsers

## Tech Stack

- `HTML`
- `CSS`
- `JavaScript`
- `Edge Impulse`
- `WebAssembly`

## Project Structure

- `index.html`  
  Main page structure for the landing page and scanning page.

- `style.css`  
  All interface styles and responsive layout rules.

- `main.js`  
  UI logic, page transitions, camera handling, upload handling, image preprocessing, and result rendering.

- `run-impulse.js`  
  Edge Impulse runtime wrapper used to communicate with the classifier.

- `edge-impulse-standalone.js`  
  Edge Impulse exported browser runtime.

- `edge-impulse-standalone.wasm`  
  WebAssembly model file used for in-browser inference.

- `server.py`  
  Lightweight local server for testing the project.

- `favicon.svg`  
  Browser tab icon.

## How It Works

1. The user opens the landing page and enters the scanning page.
2. The user can either:
   - turn on the camera, or
   - upload a banana image.
3. The image is preprocessed in the browser to match the model input format.
4. The Edge Impulse classifier runs locally in the browser.
5. The app displays:
   - the predicted banana condition
   - a confidence value
   - the score for each category
6. The interface provides feedback through colours and, where supported, mobile vibration.

## Running Locally

From the local web app folder, run:

`python server.py`

Then open:

`http://localhost:8082`

## Deployment

This web app is deployed as a static site using **GitHub Pages**.

Live demo:

`https://zcheng0319-dot.github.io/CASA0018-banana-ripeness/`

## Notes

A major part of this project was not only training the model, but also making sure the **front-end image preprocessing matched the model input format correctly**.

Another important part was refining the mobile UI so that the project feels closer to a real consumer-facing product rather than a basic technical prototype.

## Future Improvements

- Improve mobile camera compatibility across browsers
- Expand the dataset with more real-world banana photos
- Add scan history
- Add clearer user recommendations such as:
  - eat now
  - use soon
  - not ready yet
