(async () => {
    const splashScreen = document.querySelector('#splash-screen');
    const detectScreen = document.querySelector('#detect-screen');
    const startScanButton = document.querySelector('#start-scan');
    const bootStatus = document.querySelector('#boot-status');
    const resultsEl = document.querySelector('#results');
    const webcamEl = document.querySelector('#webcam');
    const cameraFallback = document.querySelector('#camera-fallback');
    const cameraFallbackMessage = cameraFallback.querySelector('p');
    const modelStatus = document.querySelector('#model-status');
    const captureMode = document.querySelector('#capture-mode');
    const cameraPowerButton = document.querySelector('#camera-power');
    const cameraToggleLabel = document.querySelector('.camera-toggle-label');
    const captureScanButton = document.querySelector('#capture-scan');
    const flashToggle = document.querySelector('#flash-toggle');
    const cameraSwitch = document.querySelector('#camera-switch');
    const uploadTrigger = document.querySelector('#upload-trigger');
    const imageUpload = document.querySelector('#image-upload');
    const manualToggle = document.querySelector('#manual-toggle');
    const manualForm = document.querySelector('#manual-form');
    const liveLabel = document.querySelector('#live-label');
    const liveNote = document.querySelector('#live-note');
    const liveBadge = document.querySelector('#live-badge');
    const confidenceValue = document.querySelector('#confidence-value');
    const confidenceFill = document.querySelector('#confidence-fill');
    const scoreUnripe = document.querySelector('#score-unripe');
    const scoreRipe = document.querySelector('#score-ripe');
    const scoreOverripe = document.querySelector('#score-overripe');
    const scoreRotten = document.querySelector('#score-rotten');
    const frameCanvas = document.createElement('canvas');
    const frameContext = frameCanvas.getContext('2d', { willReadFrequently: true });
    let classifier = null;
    let webcamStream = null;
    let activeUploadPreviewUrl = null;
    let availableVideoInputs = [];
    let currentVideoInputIndex = -1;
    let preferredFacingMode = 'environment';
    let modelInputWidth = 96;
    let modelInputHeight = 96;
    let modelInputFeatures = 96 * 96;
    let activeMode = 'standby';

    const releaseUploadPreview = () => {
        if (activeUploadPreviewUrl) {
            URL.revokeObjectURL(activeUploadPreviewUrl);
            activeUploadPreviewUrl = null;
        }
    };

    const setManualFormOpen = (open) => {
        manualForm.style.display = open ? 'block' : 'none';
        manualToggle.textContent = open ? 'Hide developer tools' : 'Developer tools';
    };

    const setCaptureMode = (mode, description) => {
        activeMode = mode;
        captureMode.textContent = description;
    };

    const setCameraToggleState = (isOn) => {
        cameraPowerButton.classList.toggle('is-on', isOn);
        cameraToggleLabel.textContent = isOn ? 'ON' : 'OFF';
    };

    const setCaptureBusy = (isBusy) => {
        captureScanButton.classList.toggle('is-busy', isBusy);
        captureScanButton.disabled = isBusy;
    };

    const pulseShutter = () => {
        captureScanButton.classList.add('is-pressed');
        window.setTimeout(() => {
            captureScanButton.classList.remove('is-pressed');
        }, 160);
    };

    const stopWebcam = () => {
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
        }

        webcamEl.srcObject = null;
        cameraFallback.hidden = false;
        cameraFallbackMessage.textContent = 'Camera preview unavailable';
        cameraFallback.style.background = '';
        webcamEl.style.display = 'block';
        setCameraToggleState(false);
        setCaptureMode('standby', 'Standby mode');
    };

    const resetPreviewSurface = () => {
        releaseUploadPreview();
        cameraFallback.hidden = false;
        cameraFallbackMessage.textContent = 'Camera preview unavailable';
        cameraFallback.style.background = '';
        webcamEl.style.display = 'block';
    };

    const refreshVideoInputs = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            availableVideoInputs = [];
            currentVideoInputIndex = -1;
            return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        availableVideoInputs = devices.filter(device => device.kind === 'videoinput');

        if (!availableVideoInputs.length) {
            currentVideoInputIndex = -1;
            return;
        }

        if (webcamStream) {
            const activeTrack = webcamStream.getVideoTracks()[0];
            const activeDeviceId = activeTrack?.getSettings?.().deviceId;
            currentVideoInputIndex = availableVideoInputs.findIndex(device => device.deviceId === activeDeviceId);
        }

        if (currentVideoInputIndex < 0) {
            currentVideoInputIndex = 0;
        }
    };

    const setLiveState = (label, badge, confidence, stateClass, note) => {
        liveLabel.textContent = label;
        liveBadge.textContent = badge;
        liveNote.textContent = note;
        confidenceValue.textContent = Math.round(confidence * 100) + '%';
        confidenceFill.style.width = Math.max(0, Math.min(100, confidence * 100)) + '%';

        liveBadge.className = 'live-badge';
        liveLabel.classList.remove('live-label-ripe', 'live-label-unripe', 'live-label-overripe', 'live-label-rotten');

        if (stateClass) {
            liveBadge.classList.add(stateClass);
        }

        if (stateClass === 'state-ripe') {
            liveLabel.classList.add('live-label-ripe');
        }
        else if (stateClass === 'state-unripe') {
            liveLabel.classList.add('live-label-unripe');
        }
        else if (stateClass === 'state-overripe') {
            liveLabel.classList.add('live-label-overripe');
        }
        else if (stateClass === 'state-rotten') {
            liveLabel.classList.add('live-label-rotten');
        }
    };

    const setClassScores = (res) => {
        const scoreMap = {
            unripe: 0,
            ripe: 0,
            overripe: 0,
            rotten: 0
        };

        if (res && Array.isArray(res.results)) {
            for (const item of res.results) {
                const key = String(item.label || '').toLowerCase();
                if (Object.prototype.hasOwnProperty.call(scoreMap, key)) {
                    scoreMap[key] = typeof item.value === 'number' ? item.value : 0;
                }
            }
        }

        scoreUnripe.textContent = Math.round(scoreMap.unripe * 100) + '%';
        scoreRipe.textContent = Math.round(scoreMap.ripe * 100) + '%';
        scoreOverripe.textContent = Math.round(scoreMap.overripe * 100) + '%';
        scoreRotten.textContent = Math.round(scoreMap.rotten * 100) + '%';
    };

    const inferLiveStateFromResult = (res) => {
        if (!res || !Array.isArray(res.results) || res.results.length === 0) {
            return {
                label: 'No classes detected',
                badge: 'No signal',
                confidence: 0,
                stateClass: 'state-error',
                note: 'No banana class confidence was returned by the model.'
            };
        }

        const top = res.results.reduce((best, item) => (
            typeof item.value === 'number' && item.value > (best?.value ?? -Infinity) ? item : best
        ), null);

        if (!top) {
            return {
                label: 'No classes detected',
                badge: 'No signal',
                confidence: 0,
                stateClass: 'state-error',
                note: 'Try another frame or image with a clearer banana subject.'
            };
        }

        const normalizedLabel = String(top.label || 'Unknown');
        const lower = normalizedLabel.toLowerCase();

        let stateClass = '';
        let badge = 'Detected';
        let note = 'Banana signal detected. Review the confidence before acting.';

        if (lower.includes('ripe') && !lower.includes('over') && !lower.includes('un')) {
            stateClass = 'state-ripe';
            badge = 'Ripe';
            note = 'Ready to eat now. Great for immediate use or serving.';
        }
        else if (lower.includes('unripe') || lower.includes('green')) {
            stateClass = 'state-unripe';
            badge = 'Unripe';
            note = 'Still needs ripening time. Keep it at room temperature for longer.';
        }
        else if (lower.includes('overripe') || lower.includes('brown')) {
            stateClass = 'state-overripe';
            badge = 'Overripe';
            note = 'Very soft and sweet. Best for smoothies, baking, or quick use.';
        }
        else if (lower.includes('rotten') || lower.includes('mold') || lower.includes('spoiled')) {
            stateClass = 'state-rotten';
            badge = 'Rotten';
            note = 'Spoilage signs detected. Check for mold or leakage before consuming.';
        }

        return {
            label: normalizedLabel,
            badge: badge,
            confidence: typeof top.value === 'number' ? top.value : 0,
            stateClass,
            note
        };
    };

    const deriveImageInputShape = (props) => {
        const numericEntries = Object.entries(props || {})
            .filter(([, value]) => typeof value === 'number' && Number.isFinite(value));
        const featureCandidate = numericEntries.find(([key, value]) => {
            const lower = key.toLowerCase();
            return lower.includes('feature') || lower.includes('input') || lower.includes('sample');
        });

        if (featureCandidate) {
            const [, value] = featureCandidate;
            const maybePackedRgbSquare = Math.sqrt(value);
            if (Number.isInteger(maybePackedRgbSquare) && maybePackedRgbSquare > 0) {
                modelInputWidth = maybePackedRgbSquare;
                modelInputHeight = maybePackedRgbSquare;
                modelInputFeatures = value;
                return;
            }
        }

        modelInputWidth = 96;
        modelInputHeight = 96;
        modelInputFeatures = 96 * 96;
    };

    const drawSourceToModelCanvas = (source, sourceWidth, sourceHeight) => {
        frameCanvas.width = modelInputWidth;
        frameCanvas.height = modelInputHeight;

        frameContext.clearRect(0, 0, modelInputWidth, modelInputHeight);

        const scale = Math.max(
            modelInputWidth / sourceWidth,
            modelInputHeight / sourceHeight
        );
        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;
        const drawX = (modelInputWidth - drawWidth) / 2;
        const drawY = (modelInputHeight - drawHeight) / 2;

        frameContext.drawImage(
            source,
            0,
            0,
            sourceWidth,
            sourceHeight,
            drawX,
            drawY,
            drawWidth,
            drawHeight
        );
    };

    const readPackedRgbFeatures = () => {
        const imageData = frameContext.getImageData(0, 0, modelInputWidth, modelInputHeight).data;
        const features = new Float32Array(modelInputFeatures);

        let fx = 0;
        for (let ix = 0; ix < imageData.length; ix += 4) {
            const red = imageData[ix];
            const green = imageData[ix + 1];
            const blue = imageData[ix + 2];
            features[fx++] = (red << 16) | (green << 8) | blue;
        }

        return features;
    };

    const captureFrameAsFeatures = () => {
        if (!webcamEl.videoWidth || !webcamEl.videoHeight) {
            throw new Error('Camera frame is not ready yet.');
        }

        drawSourceToModelCanvas(webcamEl, webcamEl.videoWidth, webcamEl.videoHeight);
        return readPackedRgbFeatures();
    };

    const classifyFrame = () => {
        if (!classifier) {
            throw new Error('Model is not ready yet.');
        }

        if (!webcamStream) {
            throw new Error('Camera is off. Turn it on before scanning.');
        }

        const features = captureFrameAsFeatures();
        return classifier.classify(features);
    };

    const classifyImageElement = (imageEl) => {
        if (!classifier) {
            throw new Error('Model is not ready yet.');
        }

        const sourceWidth = imageEl.naturalWidth || imageEl.videoWidth || imageEl.width;
        const sourceHeight = imageEl.naturalHeight || imageEl.videoHeight || imageEl.height;
        drawSourceToModelCanvas(imageEl, sourceWidth, sourceHeight);
        return classifier.classify(readPackedRgbFeatures());
    };

    const applyUploadedPreview = (imageUrl) => {
        releaseUploadPreview();
        webcamEl.style.display = 'none';
        cameraFallback.hidden = false;
        cameraFallbackMessage.textContent = 'Uploaded test image';
        cameraFallback.style.background =
            'linear-gradient(180deg, rgba(34, 54, 70, 0.2), rgba(23, 34, 45, 0.28)), url("' +
            imageUrl.replace(/"/g, '%22') +
            '") center/cover no-repeat';
        activeUploadPreviewUrl = imageUrl;
    };

    const startWebcam = async (preferredDeviceId) => {
        if (webcamStream) {
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            cameraFallback.hidden = false;
            modelStatus.textContent = 'Camera access is not supported in this browser.';
            return;
        }

        if (!window.isSecureContext) {
            cameraFallback.hidden = false;
            modelStatus.textContent = 'Mobile camera needs a secure page. Open this site with HTTPS or a trusted local tunnel.';
            return;
        }

        try {
            resetPreviewSurface();
            const videoConstraints = preferredDeviceId
                ? { deviceId: { exact: preferredDeviceId } }
                : { facingMode: { ideal: preferredFacingMode } };

            webcamStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
                audio: false
            });

            webcamEl.style.display = 'block';
            webcamEl.srcObject = webcamStream;
            cameraFallback.hidden = true;
            modelStatus.textContent = 'Camera is on and ready for banana scanning.';
            setCameraToggleState(true);
            setCaptureMode('camera', 'Camera mode');
            await refreshVideoInputs();
        }
        catch (error) {
            cameraFallback.hidden = false;
            modelStatus.textContent = 'Camera could not start. Check browser permission, HTTPS access, or try the upload mode.';
            setCameraToggleState(false);
        }
    };

    const showDetectScreen = () => {
        splashScreen.classList.add('hidden');
        splashScreen.classList.remove('active');
        detectScreen.classList.add('active');
        detectScreen.classList.remove('entering');
        void detectScreen.offsetWidth;
        detectScreen.classList.add('entering');
        window.setTimeout(() => {
            detectScreen.classList.remove('entering');
        }, 430);
        stopWebcam();
        modelStatus.textContent = 'Camera is off. Tap the power button to start scanning.';
        setCaptureMode('standby', 'Standby mode');
    };

    startScanButton.addEventListener('click', showDetectScreen);
    uploadTrigger.addEventListener('click', () => imageUpload.click());
    cameraPowerButton.addEventListener('click', async () => {
        if (webcamStream) {
            stopWebcam();
            modelStatus.textContent = 'Camera is off. Tap the power button to reopen it.';
        }
        else {
            await startWebcam();
        }
    });
    manualToggle.addEventListener('click', () => {
        setManualFormOpen(manualForm.style.display !== 'block');
    });
    imageUpload.addEventListener('change', async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }

        const imageUrl = URL.createObjectURL(file);
        const testImage = new Image();

        testImage.onload = () => {
            try {
                stopWebcam();
                applyUploadedPreview(imageUrl);
                setCaptureMode('upload', 'Upload mode');

                const res = classifyImageElement(testImage);
                const liveState = inferLiveStateFromResult(res);
                modelStatus.textContent = 'Uploaded image analysis complete.';
                setLiveState(liveState.label, liveState.badge, liveState.confidence, liveState.stateClass, liveState.note);
                setClassScores(res);
                resultsEl.textContent = JSON.stringify(res, null, 4);
            }
            catch (ex) {
                resultsEl.textContent = 'Failed to classify: ' + (ex.message || ex.toString());
                modelStatus.textContent = 'Uploaded image analysis failed.';
                setLiveState('Scan failed', 'Retry', 0, 'state-error', 'Try another test image or switch back to camera mode.');
                setClassScores(null);
            }
        };

        testImage.src = imageUrl;
    });

    try {
        if (typeof EdgeImpulseClassifier !== 'function') {
            throw new Error('EdgeImpulseClassifier is unavailable');
        }

        classifier = new EdgeImpulseClassifier();
        await classifier.init();

        const project = classifier.getProjectInfo();
        const props = classifier.getProperties();
        deriveImageInputShape(props);
        bootStatus.textContent = 'Model ready: ' + project.name + ' v' + project.deploy_version;
        modelStatus.textContent = 'Camera is off. Tap the power button to start scanning.';
        setLiveState('Waiting for banana signal', 'Prepared', 0, '', 'Turn on the camera or upload a banana image to begin.');
        setClassScores(null);
    }
    catch (ex) {
        bootStatus.textContent = 'Model failed to load. You can still preview the interface.';
        modelStatus.textContent = 'Model failed to load. Camera stays off until you retry.';
        resultsEl.textContent = 'Initialization failed: ' + (ex.message || ex.toString());
        setLiveState('Initialization issue', 'Offline', 0, 'state-error', 'Reload the page after checking the model assets.');
        setClassScores(null);
    }

    captureScanButton.addEventListener('click', async () => {
        pulseShutter();
        setCaptureBusy(true);
        try {
            modelStatus.textContent = 'Analyzing banana frame...';
            const res = classifyFrame();
            const liveState = inferLiveStateFromResult(res);
            modelStatus.textContent = 'Banana analysis complete.';
            setLiveState(liveState.label, liveState.badge, liveState.confidence, liveState.stateClass, liveState.note);
            resultsEl.textContent = JSON.stringify(res, null, 4);
            setClassScores(res);
        }
        catch (ex) {
            resultsEl.textContent = 'Failed to classify: ' + (ex.message || ex.toString());
            modelStatus.textContent = 'Scan failed. Check camera or model state and try again.';
            setLiveState('Scan failed', 'Retry', 0, 'state-error', 'Check camera power, framing, or model status and try again.');
            setClassScores(null);
        }
        finally {
            setCaptureBusy(false);
        }
    });

    document.querySelector('#run-inference').onclick = () => {
        try {
            if (!classifier) {
                throw new Error('Model is not ready yet.');
            }

            const features = document.querySelector('#features').value
                .split(',')
                .filter(x => x.trim().length > 0)
                .map(x => Number(x.trim()));

            if (features.length === 0) {
                throw new Error('Please enter at least one feature value.');
            }

            const res = classifier.classify(features);
            resultsEl.textContent = JSON.stringify(res, null, 4);
            modelStatus.textContent = 'Banana analysis complete.';
            const liveState = inferLiveStateFromResult(res);
            setLiveState(liveState.label, liveState.badge, liveState.confidence, liveState.stateClass, liveState.note);
            setClassScores(res);
        }
        catch (ex) {
            resultsEl.textContent = 'Failed to classify: ' + (ex.message || ex.toString());
            modelStatus.textContent = 'Scan failed. Check your input or model state and try again.';
            setLiveState('Scan failed', 'Retry', 0, 'state-error', 'Manual feature input did not match the model expectation.');
            setClassScores(null);
        }
    };

    flashToggle.addEventListener('click', () => {
        modelStatus.textContent = 'Flash control is reserved for a future hardware-enabled version.';
    });

    cameraSwitch.addEventListener('click', async () => {
        try {
            if (activeMode === 'upload') {
                modelStatus.textContent = 'Switch camera is only available in camera mode. Turn the camera on to use it.';
                return;
            }

            await refreshVideoInputs();

            if (availableVideoInputs.length > 1) {
                const nextIndex = currentVideoInputIndex >= 0
                    ? (currentVideoInputIndex + 1) % availableVideoInputs.length
                    : 0;
                const nextDevice = availableVideoInputs[nextIndex];

                stopWebcam();
                await startWebcam(nextDevice.deviceId);
                currentVideoInputIndex = nextIndex;
                modelStatus.textContent = 'Switched to another available camera.';
                return;
            }

            preferredFacingMode = preferredFacingMode === 'environment' ? 'user' : 'environment';

            if (!webcamStream) {
                resetPreviewSurface();
                modelStatus.textContent = preferredFacingMode === 'user'
                    ? 'Front camera selected. Tap ON to open it.'
                    : 'Rear camera selected. Tap ON to open it.';
                return;
            }

            stopWebcam();
            await startWebcam();
            modelStatus.textContent = preferredFacingMode === 'user'
                ? 'Switched to front camera.'
                : 'Switched to rear camera.';
        }
        catch (error) {
            modelStatus.textContent = 'Camera switch failed. Stay on the current camera and try again.';
        }
    });

    setManualFormOpen(false);
    setCaptureMode('standby', 'Standby mode');
    setLiveState('Waiting for banana signal', 'Idle', 0, '', 'Turn on the camera or upload a banana image to begin.');
    setCameraToggleState(false);
    setCaptureBusy(false);
    resultsEl.textContent = '';
    setClassScores(null);
})();
