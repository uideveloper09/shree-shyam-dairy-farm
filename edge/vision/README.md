# Edge Vision (Jetson / Pi)

Python runtime for YOLO, OpenCV, MediaPipe — deploy separately.

```bash
pip install opencv-python ultralytics mediapipe
python src/main.py
```

Posts detections to `POST /api/v1/vision/ingest` with header `x-vision-api-key`.

Pipelines: cow_face, cow_identification, bcs, weight_estimation, lameness, animal_counting, intruder.
