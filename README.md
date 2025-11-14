# 🏥 AI-Powered Breast Cancer Detection from Ultrasound Images

<p align="center">
  <img src="https://img.shields.io/badge/Sensitivity-96.88%25-success?style=for-the-badge" alt="Sensitivity">
  <img src="https://img.shields.io/badge/AUC-0.9518-blue?style=for-the-badge" alt="AUC">
  <img src="https://img.shields.io/badge/False%20Negatives-75%25%20Reduction-red?style=for-the-badge" alt="FN Reduction">
  <img src="https://img.shields.io/badge/Python-3.11+-yellow?style=for-the-badge" alt="Python">
</p>

<p align="center">
  <b>Saving lives through early detection:</b> An ensemble deep learning approach that missed only 1 out of 32 malignant cases.
</p>

---

## 🎯 The Mission

Every missed cancer diagnosis is a life at risk. Traditional ultrasound interpretation varies between radiologists, with fatigue and experience affecting accuracy. We built an AI system that acts as a vigilant second pair of eyes, catching what humans might miss.

**The Result?** A 75% reduction in missed cancer cases compared to single-model approaches.

## 📊 Performance at a Glance

<table>
<tr>
<td width="50%">

### Our Ensemble Model
- ✅ **96.88%** Sensitivity (31/32 cancers detected)
- ✅ **0.9518** AUC Score
- ✅ **Only 1** missed cancer
- ✅ **77.78%** Specificity

</td>
<td width="50%">

### vs. Traditional Single Model
- ❌ 87.5% Sensitivity
- ❌ 0.9704 AUC Score  
- ❌ 4 missed cancers
- ❌ 89.7% Specificity

</td>
</tr>
</table>

> **Key Insight**: While specificity decreased, the dramatic improvement in cancer detection far outweighs more follow-up examinations.

## 🚀 Quick Start

### Prerequisites
```bash
Python 3.11+
CUDA-capable GPU (recommended)
8GB+ RAM
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/breast-cancer-ultrasound-ai.git
cd breast-cancer-ultrasound-ai
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Download pre-trained model**
```bash
# Download our best ensemble model (264MB)
wget https://your-model-url/breast_cancer_ensemble_model.pth

# Or use the lighter single model (15.6MB)
wget https://your-model-url/breast_cancer_single_model.pth
```

### 🏃‍♂️ Run Inference

```python
from inference import BreastCancerDetector

# Initialize detector
detector = BreastCancerDetector('breast_cancer_ensemble_model.pth')

# Predict on single image
result = detector.predict('path/to/ultrasound.png')
print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']:.2%}")
print(f"Malignancy Probability: {result['probability']:.4f}")
```

### 🌐 Web Interface

Launch the Streamlit web app for an interactive experience:

```bash
streamlit run app.py
```

Navigate to `http://localhost:8501` and upload ultrasound images for instant analysis.

## 🧠 How It Works

### The Ensemble Advantage

We don't rely on a single AI model. Instead, we combine the wisdom of 5 specialized networks:

```
┌─────────────┐  ┌─────────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────┐
│ EfficientNet│  │ EfficientNet│  │  ResNet50  │  │  DenseNet121 │  │ ConvNeXt-Tiny│
│     B0      │  │     B1      │  │            │  │              │  │              │
└──────┬──────┘  └──────┬──────┘  └─────┬──────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                │                 │                 │
       └─────────────────┴────────────────┴─────────────────┴─────────────────┘
                                          │
                                   ┌──────▼──────┐
                                   │  Weighted   │
                                   │  Ensemble   │
                                   └──────┬──────┘
                                          │
                                   ┌──────▼──────┐
                                   │ Prediction  │
                                   └─────────────┘
```

Each model sees different patterns:
- **EfficientNet**: Excels at texture analysis
- **ResNet**: Captures deep hierarchical features
- **DenseNet**: Identifies fine-grained details
- **ConvNeXt**: Modern architecture for spatial relationships

### Medical-Specific Image Processing

Standard augmentation isn't enough for ultrasound images. We implement:

1. **Elastic Deformation**: Simulates tissue compression during scanning
2. **CLAHE Enhancement**: Improves contrast in poorly lit regions
3. **Speckle Noise**: Mimics ultrasound-specific artifacts
4. **Smart ROI Extraction**: Focuses on lesion areas using provided masks

## 📈 Training Your Own Model

### Dataset Structure
```
dataset/
├── training_set/
│   ├── benign/
│   │   ├── benign (1).png
│   │   ├── benign (1)_mask.png
│   │   └── ...
│   └── malignant/
│       ├── malignant (1).png
│       ├── malignant (1)_mask.png
│       └── ...
└── testing_set/
    └── ...
```

### Training Pipeline

1. **Configure training**
```python
config = Config(
    batch_size=16,
    learning_rate=1e-3,
    epochs=50,
    ensemble_models=['efficientnet_b0', 'resnet50', ...],
    use_amp=True  # Mixed precision for faster training
)
```

2. **Launch training**
```bash
python train.py --config configs/ensemble_config.yaml
```

3. **Monitor progress**
```bash
tensorboard --logdir logs/
```

## 🔬 Technical Deep Dive

### Why Ensemble Learning?

Single models have blind spots. Our ensemble approach:
- **Reduces overfitting** through model diversity
- **Improves robustness** against edge cases  
- **Provides uncertainty estimates** through disagreement analysis

### Handling Class Imbalance

With 404 benign vs 161 malignant cases:
```python
# Weighted loss penalizes missed cancers more heavily
pos_weight = torch.tensor([num_benign/num_malignant])
criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

# Balanced sampling ensures equal class exposure
sampler = WeightedRandomSampler(weights, len(dataset))
```

### Advanced Features

- **Test-Time Augmentation**: 5 different views averaged for robust predictions
- **Attention Mechanisms**: Focus on suspicious regions
- **Multi-Scale Processing**: Analyze lesions at different resolutions

## 📋 Results Visualization

### Training Dynamics
<p align="center">
  <img src="docs/images/training_history.png" width="800" alt="Training History">
</p>

The model converges smoothly with controlled overfitting through early stopping.

### Confusion Matrix Analysis
<p align="center">
  <img src="docs/images/confusion_matrix.png" width="400" alt="Confusion Matrix">
</p>

- ✅ **True Positives**: 31 (Correctly identified cancers)
- ✅ **True Negatives**: 63 (Correctly identified benign)
- ⚠️ **False Positives**: 18 (Extra caution - better safe than sorry)
- 🚨 **False Negatives**: 1 (Our primary minimization target)

### ROC Curve
<p align="center">
  <img src="docs/images/roc_curve.png" width="500" alt="ROC Curve">
</p>

Near-perfect separation with AUC of 0.9518, indicating excellent discrimination ability.

## 🚧 Limitations & Future Work

### Current Limitations
1. **Higher false positive rate**: 18 benign cases flagged as suspicious
2. **Large model size**: 264MB for full ensemble
3. **Binary classification only**: Doesn't identify lesion subtypes

### Roadmap
- [ ] Multi-class classification (cyst, fibroadenoma, carcinoma)
- [ ] Model compression through knowledge distillation
- [ ] GradCAM visualization for interpretability
- [ ] Real-time video processing for live ultrasound
- [ ] Integration with PACS systems

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Areas needing help:
- Model optimization for edge devices
- Additional augmentation strategies
- Clinical validation studies
- UI/UX improvements

## 📜 Citation

If you use this work in your research, please cite:

```bibtex
@software{Lumina_Health_breast_ultrasound_ai_2025,
  title={Ensemble Deep Learning for Breast Cancer Detection in Ultrasound Images},
  author={Peter Macharia},
  year={2025},
  url={https://github.com/yourusername/breast-cancer-ultrasound-ai}
}
```

## ⚖️ License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## ⚠️ Medical Disclaimer

This tool is intended for research and educational purposes only. It should not be used as the sole basis for medical decisions. Always consult qualified healthcare professionals for medical advice.

## 🙏 Acknowledgments

- Dataset provided by IUSS 23-24 Automatic Diagnosis Breast Cancer Competition
- Built with PyTorch, timm, and the amazing open-source community
- Special thanks to radiologists who validated our approach

---

<p align="center">
  <b>Together, we can make cancer screening more accessible and accurate.</b><br>
  Star ⭐ this repo if you believe in the mission!

</p>s
