import streamlit as st
import torch
import torch.nn as nn
import timm
import numpy as np
import cv2
from PIL import Image
import albumentations as A
from albumentations.pytorch import ToTensorV2
import plotly.graph_objects as go
import torch.nn.functional as F
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

# Page config
st.set_page_config(
    page_title="Breast Ultrasound Cancer Detection",
    page_icon="🏥",
    layout="wide"
)

# Load Ensemble Model
@st.cache_resource
def load_model(model_path='Breast scans/breast_cancer_ensemble_model.pth'):
    """Load the trained ensemble model"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    checkpoint = torch.load(model_path, map_location=device)

    class EnsembleModel(nn.Module):
        def __init__(self, model_names, num_classes=1):
            super().__init__()
            self.models = nn.ModuleList()
            for model_name in model_names:
                model = timm.create_model(model_name, pretrained=False, num_classes=num_classes)
                self.models.append(model)
            self.model_weights = nn.Parameter(torch.ones(len(model_names)) / len(model_names))

        def forward(self, x):
            predictions = [model(x) for model in self.models]
            weights = F.softmax(self.model_weights, dim=0)
            weighted_preds = torch.stack(predictions, dim=0)
            return (weighted_preds * weights.view(-1, 1, 1)).sum(dim=0)

    model = EnsembleModel(checkpoint['model_config'], checkpoint['num_classes'])
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    model.to(device)

    return model, device, checkpoint

def get_transform(image_size=224):
    return A.Compose([
        A.Resize(image_size, image_size),
        A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])

def predict_image(model, image, device, transform):
    image_np = np.array(image.convert('RGB'))
    augmented = transform(image=image_np)
    image_tensor = augmented['image'].unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(image_tensor)
        if output.dim() > 1:
            output = output.squeeze(-1)
        probability = torch.sigmoid(output).item()
    return probability

def generate_pdf_report(image, prediction, confidence, model_name):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 800, "Breast Cancer Analysis Report")
    c.setFont("Helvetica", 12)
    c.drawString(50, 770, f"Model Used: {model_name}")
    c.drawString(50, 750, f"Prediction: {prediction}")
    c.drawString(50, 730, f"Confidence: {confidence:.2%}")
    c.drawString(50, 700, "Note: This tool is for educational/demo purposes only.")
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer

# --- UI Layout ---
st.title("🏥 Breast Ultrasound Cancer Detection")
st.markdown("### AI-Powered Analysis of Breast Ultrasound Images")

# Sidebar
with st.sidebar:
    st.header("About")
    st.info(
        "This application uses an ensemble of deep learning models to analyze "
        "breast ultrasound images and predict the likelihood of malignancy."
    )
    st.header("Model Performance")
    st.metric("Sensitivity", "96.88%")
    st.metric("Specificity", "77.78%")
    st.metric("AUC", "0.9518")
    st.header("Instructions")
    st.markdown("""
        1. Upload a breast ultrasound image  
        2. Click 'Analyze' to get prediction  
        3. Download PDF report (optional)  
        ⚠️ This is a screening tool and does not replace medical diagnosis.
    """)

# Main UI
col1, col2 = st.columns(2)

with col1:
    st.header("Upload Image")
    uploaded_file = st.file_uploader("Choose an ultrasound image...", type=['png', 'jpg', 'jpeg'])

    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        st.image(image, caption="Uploaded Image", use_column_width=True)

        if st.button("🔍 Analyze Image", type="primary", use_container_width=True):
            with st.spinner("Analyzing image..."):
                model, device, checkpoint = load_model()
                transform = get_transform(checkpoint['image_size'])
                probability = predict_image(model, image, device, transform)
                st.session_state['probability'] = probability
                st.session_state['analyzed'] = True
                st.session_state['image'] = image
                st.session_state['model_name'] = "Ensemble Model"

with col2:
    st.header("Analysis Results")

    if st.session_state.get('analyzed'):
        probability = st.session_state['probability']
        prediction = "Malignant" if probability > 0.5 else "Benign"
        confidence = probability if probability > 0.5 else 1 - probability
        color = "red" if prediction == "Malignant" else "green"
        emoji = "⚠️" if prediction == "Malignant" else "✅"

        st.markdown(f"### {emoji} Prediction: **:{color}[{prediction}]**")
        st.markdown(f"**Confidence**: {confidence:.1%}")

        # Gauge Chart
        fig = go.Figure(go.Indicator(
            mode="gauge+number+delta",
            value=probability * 100,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Malignancy Probability (%)"},
            delta={'reference': 50},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkred" if probability > 0.5 else "darkblue"},
                'steps': [
                    {'range': [0, 25], 'color': "lightgreen"},
                    {'range': [25, 50], 'color': "yellow"},
                    {'range': [50, 75], 'color': "orange"},
                    {'range': [75, 100], 'color': "lightcoral"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 50
                }
            }
        ))
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)

        # Details and Report
        with st.expander("Detailed Analysis"):
            col_a, col_b = st.columns(2)
            col_a.metric("Benign Probability", f"{(1-probability):.2%}")
            col_b.metric("Malignant Probability", f"{probability:.2%}")
            st.info(
                "**Clinical Recommendation**: "
                f"{'Further investigation recommended due to high malignancy probability.' if probability > 0.5 else 'Low risk detected, but regular screening is still important.'}"
            )

        # Download PDF
        pdf = generate_pdf_report(
            image=st.session_state['image'],
            prediction=prediction,
            confidence=confidence,
            model_name=st.session_state['model_name']
        )
        st.download_button(
            label="📄 Download PDF Report",
            data=pdf,
            file_name="breast_cancer_report.pdf",
            mime="application/pdf"
        )
    else:
        st.info("👈 Upload an image and click 'Analyze' to see results")

# Footer
st.markdown("---")
st.caption("⚠️ **Disclaimer**: This tool is for screening purposes only and should not replace professional medical diagnosis.")
