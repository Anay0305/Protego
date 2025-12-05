# Protego ML Module

This directory contains the machine learning components for distress detection.

## Current Status: STUB MODE

The current implementation (`inference.py`) is a **placeholder** that returns simulated results for testing purposes.

## Production TODO

To implement production-ready distress detection:

### 1. Audio Distress Detection
- [ ] Collect and label training data (screams, distress calls, normal audio)
- [ ] Extract audio features (MFCCs, spectrograms, mel-frequency features)
- [ ] Train classification model (CNN, RNN, or Transformer)
- [ ] Optimize for real-time inference
- [ ] Deploy model to mobile/edge devices

### 2. Motion/Fall Detection
- [ ] Collect accelerometer/gyroscope data from falls and normal activities
- [ ] Engineer features (magnitude, jerk, frequency domain features)
- [ ] Train fall detection model (Random Forest, LSTM, or 1D CNN)
- [ ] Implement real-time processing pipeline
- [ ] Add context-aware detection (e.g., stairs vs. sitting down)

### 3. Model Architecture Recommendations

#### Audio Detection
```python
# Example TensorFlow/Keras model
model = tf.keras.Sequential([
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(128, 128, 1)),
    layers.MaxPooling2D((2, 2)),
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.MaxPooling2D((2, 2)),
    layers.Flatten(),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(5, activation='softmax')  # 5 distress types
])
```

#### Motion Detection
```python
# Example PyTorch model
class MotionDetector(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(6, 64, 2, batch_first=True)  # 6 sensor inputs
        self.fc = nn.Linear(64, 5)  # 5 motion types

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        return self.fc(lstm_out[:, -1, :])
```

### 4. Integration Steps

1. **Train your model**
2. **Export model** (SavedModel, ONNX, TFLite, etc.)
3. **Replace stub** in `inference.py`:
   ```python
   import tensorflow as tf
   self.model = tf.keras.models.load_model('models/distress_detector.h5')
   ```
4. **Update detection methods** to use actual model inference
5. **Add preprocessing** (normalization, feature extraction)
6. **Calibrate confidence thresholds**

## Usage (Current Stub)

```bash
# Test audio detection
python ml/inference.py sample_audio.wav

# Test motion detection
python ml/inference.py --motion

# Output example:
{
  "type": "scream",
  "confidence": 0.873,
  "is_distress": true,
  "threshold_exceeded": true,
  "stub_mode": true
}
```

## Dependencies for Production

Add to requirements.txt:
```
tensorflow==2.15.0  # or pytorch==2.1.0
librosa==0.10.1     # audio processing
numpy==1.24.3
scipy==1.11.4
```

## References

- [Audio Event Detection Papers](https://paperswithcode.com/task/audio-event-detection)
- [Fall Detection Research](https://www.mdpi.com/journal/sensors/special_issues/Fall_Detection)
- [TensorFlow Audio Recognition](https://www.tensorflow.org/tutorials/audio/simple_audio)
