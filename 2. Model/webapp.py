import streamlit as st
import pandas as pd
import joblib
import time
import matplotlib.pyplot as plt
import seaborn as sns

# --- Page Configuration ---
st.set_page_config(
    page_title="Luminara Student Success Simulator (V2)",
    page_icon="✨",
    layout="wide"
)

# --- Model Loading ---
# Use caching to avoid reloading the model on every interaction
@st.cache_resource
def load_model(model_path):
    """Loads the trained model from the specified path."""
    try:
        model = joblib.load(model_path)
        return model
    except FileNotFoundError:
        st.error(f"Model file not found at {model_path}. Please ensure the model is in the correct directory.")
        return None

# --- Sidebar for User Input ---
def get_user_input():
    """Creates the sidebar for user input and returns a DataFrame."""
    st.sidebar.header("Student Profile Configuration")
    st.sidebar.markdown("Adjust the sliders and dropdowns to create a hypothetical student profile.")

    # --- Dictionary to hold all inputs ---
    inputs = {}

    # --- Numerical Inputs ---
    st.sidebar.subheader("Demographics & Background")
    inputs['age'] = st.sidebar.slider("Age", 15, 22, 17)
    inputs['Medu'] = st.sidebar.slider("Mother's Education (0-4)", 0, 4, 2)
    inputs['Fedu'] = st.sidebar.slider("Father's Education (0-4)", 0, 4, 2)
    
    st.sidebar.subheader("Study Habits & History")
    inputs['studytime'] = st.sidebar.slider("Weekly Study Time (1-4 hours)", 1, 4, 2)
    inputs['failures'] = st.sidebar.slider("Number of Past Failures", 0, 3, 0)
    inputs['absences'] = st.sidebar.slider("Number of School Absences", 0, 93, 4)
    # New inputs for G1 and G2 for engineered features
    inputs['G1'] = st.sidebar.slider("First Period Grade (G1)", 0, 20, 10)
    inputs['G2'] = st.sidebar.slider("Second Period Grade (G2)", 0, 20, 10)


    st.sidebar.subheader("Social & Lifestyle")
    inputs['famrel'] = st.sidebar.slider("Family Relationship Quality (1-5)", 1, 5, 4)
    inputs['freetime'] = st.sidebar.slider("Free Time After School (1-5)", 1, 5, 3)
    inputs['goout'] = st.sidebar.slider("Going Out with Friends (1-5)", 1, 5, 3)
    inputs['health'] = st.sidebar.slider("Current Health Status (1-5)", 1, 5, 4)
    inputs['Dalc'] = st.sidebar.slider("Workday Alcohol Consumption (1-5)", 1, 5, 1)
    inputs['Walc'] = st.sidebar.slider("Weekend Alcohol Consumption (1-5)", 1, 5, 2)
    inputs['traveltime'] = st.sidebar.slider("Home to School Travel Time (1-4)", 1, 4, 1)

    # --- Categorical Inputs (User-friendly dropdowns) ---
    st.sidebar.subheader("School & Support")
    school = st.sidebar.selectbox("School", ["GP", "MS"])
    sex = st.sidebar.selectbox("Sex", ["F", "M"])
    address = st.sidebar.selectbox("Address", ["U", "R"])
    famsize = st.sidebar.selectbox("Family Size", ["LE3", "GT3"])
    Pstatus = st.sidebar.selectbox("Parent's Cohabitation Status", ["T", "A"])
    schoolsup = st.sidebar.selectbox("Extra Educational Support", ["no", "yes"])
    famsup = st.sidebar.selectbox("Family Educational Support", ["no", "yes"])
    paid = st.sidebar.selectbox("Extra Paid Classes", ["no", "yes"])
    activities = st.sidebar.selectbox("Extra-Curricular Activities", ["no", "yes"])
    nursery = st.sidebar.selectbox("Attended Nursery School", ["no", "yes"])
    higher = st.sidebar.selectbox("Wants to Take Higher Education", ["no", "yes"])
    internet = st.sidebar.selectbox("Internet Access at Home", ["no", "yes"])
    romantic = st.sidebar.selectbox("In a Romantic Relationship", ["no", "yes"])

    # --- Convert categorical inputs to one-hot encoded format ---
    # This must match the columns the model was trained on EXACTLY.
    # The `drop_first=True` logic is replicated here.
    inputs['school_MS'] = 1 if school == 'MS' else 0
    inputs['sex_M'] = 1 if sex == 'M' else 0
    inputs['address_U'] = 1 if address == 'U' else 0
    inputs['famsize_LE3'] = 1 if famsize == 'LE3' else 0
    inputs['Pstatus_T'] = 1 if Pstatus == 'T' else 0
    inputs['schoolsup_yes'] = 1 if schoolsup == 'yes' else 0
    inputs['famsup_yes'] = 1 if famsup == 'yes' else 0
    inputs['paid_yes'] = 1 if paid == 'yes' else 0
    inputs['activities_yes'] = 1 if activities == 'yes' else 0
    inputs['nursery_yes'] = 1 if nursery == 'yes' else 0
    inputs['higher_yes'] = 1 if higher == 'yes' else 0
    inputs['internet_yes'] = 1 if internet == 'yes' else 0
    inputs['romantic_yes'] = 1 if romantic == 'yes' else 0

    # --- Complex Categorical Features (Mjob, Fjob, reason, guardian) ---
    mjob = st.sidebar.selectbox("Mother's Job", ["at_home", "health", "other", "services", "teacher"])
    inputs['Mjob_health'] = 1 if mjob == 'health' else 0
    inputs['Mjob_other'] = 1 if mjob == 'other' else 0
    inputs['Mjob_services'] = 1 if mjob == 'services' else 0
    inputs['Mjob_teacher'] = 1 if mjob == 'teacher' else 0

    fjob = st.sidebar.selectbox("Father's Job", ["at_home", "health", "other", "services", "teacher"])
    inputs['Fjob_health'] = 1 if fjob == 'health' else 0
    inputs['Fjob_other'] = 1 if fjob == 'other' else 0
    inputs['Fjob_services'] = 1 if fjob == 'services' else 0
    inputs['Fjob_teacher'] = 1 if fjob == 'teacher' else 0

    reason = st.sidebar.selectbox("Reason to Choose School", ["course", "home", "reputation", "other"])
    inputs['reason_home'] = 1 if reason == 'home' else 0
    inputs['reason_other'] = 1 if reason == 'other' else 0
    inputs['reason_reputation'] = 1 if reason == 'reputation' else 0

    guardian = st.sidebar.selectbox("Guardian", ["mother", "father", "other"])
    inputs['guardian_mother'] = 1 if guardian == 'mother' else 0
    inputs['guardian_other'] = 1 if guardian == 'other' else 0

    # --- Engineered Features ---
    inputs['Academic_History_Index'] = (inputs['G1'] + inputs['G2']) / 2 - inputs['failures']
    inputs['Support_System_Score'] = inputs['Medu'] + inputs['Fedu'] + \
                                     (1 if famsup == 'yes' else 0) + \
                                     (1 if paid == 'yes' else 0)
    inputs['Distraction_Index'] = inputs['goout'] + inputs['Dalc'] + inputs['Walc']

    # --- Create DataFrame ---
    # The order of columns must match the order the model was trained on.
    # This order is derived from df_processed_v2 in Luminara.ipynb
    feature_order = [
        'age', 'Medu', 'Fedu', 'traveltime', 'studytime', 'failures', 'famrel',
        'freetime', 'goout', 'Dalc', 'Walc', 'health', 'absences',
        'Academic_History_Index', 'Support_System_Score', 'Distraction_Index',
        'school_MS', 'sex_M', 'address_U', 'famsize_LE3', 'Pstatus_T',
        'Mjob_health', 'Mjob_other', 'Mjob_services', 'Mjob_teacher',
        'Fjob_health', 'Fjob_other', 'Fjob_services', 'Fjob_teacher',
        'reason_home', 'reason_other', 'reason_reputation', 'guardian_mother',
        'guardian_other', 'schoolsup_yes', 'famsup_yes', 'paid_yes',
        'activities_yes', 'nursery_yes', 'higher_yes', 'internet_yes',
        'romantic_yes'
    ]
    
    data = pd.DataFrame([inputs])[feature_order]
    return data

# --- Main Application ---
st.title("✨ Luminara Student Success Simulator (V2)")
st.markdown("""
Welcome to the Luminara simulator! This tool uses a machine learning model trained on real student data to predict a student's academic risk level.
This version incorporates advanced features for improved prediction.
Use the sidebar on the left to configure a student's profile and see how different factors can influence their success.
""")

# --- Load Model ---
model = load_model("2. Model/student_risk_model_v2.joblib")

if model:
    # --- Get User Input ---
    user_input_df = get_user_input()

    # --- Display User Input ---
    st.subheader("Current Student Profile:")
    st.dataframe(user_input_df)

    # --- Prediction Logic ---
    st.subheader("Prediction:")
    if st.button("Predict Academic Risk"):
        prediction = model.predict(user_input_df)[0]
        prediction_proba = model.predict_proba(user_input_df)[0]

        risk_colors = {
            'High Risk': 'red',
            'Medium Risk': 'orange',
            'Low Risk': 'green'
        }
        
        st.markdown(f"The predicted academic risk for this student is: <span style='color:{risk_colors.get(prediction, 'black')}; font-size: 24px; font-weight: bold;'>{prediction}</span>", unsafe_allow_html=True)

        # --- Prediction Confidence ---
        st.subheader("Prediction Confidence:")
        proba_df = pd.DataFrame({
            'Risk Category': model.classes_,
            'Confidence': prediction_proba
        }).sort_values(by='Confidence', ascending=False)

        fig_proba, ax_proba = plt.subplots(figsize=(8, 4))
        sns.barplot(x='Confidence', y='Risk Category', data=proba_df, palette='viridis', ax=ax_proba)
        ax_proba.set_xlim(0, 1)
        ax_proba.set_title("Model's Confidence for Each Risk Category")
        ax_proba.set_xlabel("Confidence")
        ax_proba.set_ylabel("Risk Category")
        st.pyplot(fig_proba)

        # --- Feature Importance ---
        st.subheader("Top Factors Influencing Prediction:")
        if hasattr(model, 'feature_importances_'):
            feature_importances = pd.Series(model.feature_importances_, index=user_input_df.columns)
            top_features = feature_importances.nlargest(10)

            fig_features, ax_features = plt.subplots(figsize=(10, 6))
            sns.barplot(x=top_features.values, y=top_features.index, palette='magma', ax=ax_features)
            ax_features.set_title("Top 10 Feature Importances")
            ax_features.set_xlabel("Importance")
            ax_features.set_ylabel("Feature")
            st.pyplot(fig_features)
        else:
            st.info("Feature importances are not available for this model type.")

else:
    st.warning("Model could not be loaded. Please check the file path and ensure the model file exists.")

# --- Feature Definitions (Key) ---
with st.expander("Feature Definitions (Key)"):
    st.markdown("""
    Here's a quick guide to the features used in the model:

    **Demographics & Background:**
    - `age`: Student's age (numeric).
    - `Medu`: Mother's education level (0 - none, 1 - primary education (4th grade), 2 – 5th to 9th grade, 3 – secondary education, 4 – higher education).
    - `Fedu`: Father's education level (same scale as Medu).

    **Study Habits & History:**
    - `studytime`: Weekly study time (1 - <2 hours, 2 - 2 to 5 hours, 3 - 5 to 10 hours, 4 - >10 hours).
    - `failures`: Number of past class failures (n if 1<=n<3, else 4).
    - `absences`: Number of school absences (numeric).
    - `G1`: First period grade (numeric, 0-20).
    - `G2`: Second period grade (numeric, 0-20).

    **Social & Lifestyle:**
    - `famrel`: Quality of family relationships (1 - very bad to 5 - excellent).
    - `freetime`: Free time after school (1 - very low to 5 - very high).
    - `goout`: Going out with friends (1 - very low to 5 - very high).
    - `health`: Current health status (1 - very bad to 5 - very good).
    - `Dalc`: Workday alcohol consumption (1 - very low to 5 - very high).
    - `Walc`: Weekend alcohol consumption (1 - very low to 5 - very high).
    - `traveltime`: Home to school travel time (1 - <15 min, 2 - 15 to 30 min, 3 - 30 min to 1 hour, 4 - >1 hour).

    **School & Support:**
    - `school_MS`: School attended (GP - Gabriel Pereira, MS - Mousinho da Silveira). `school_MS` is 1 if MS, 0 if GP.
    - `sex_M`: Student's sex (F - female, M - male). `sex_M` is 1 if M, 0 if F.
    - `address_U`: Student's home address type (U - urban, R - rural). `address_U` is 1 if U, 0 if R.
    - `famsize_LE3`: Family size (LE3 - less or equal to 3, GT3 - greater than 3). `famsize_LE3` is 1 if LE3, 0 if GT3.
    - `Pstatus_T`: Parent's cohabitation status (T - living together, A - apart). `Pstatus_T` is 1 if T, 0 if A.
    - `schoolsup_yes`: Extra educational support (yes or no). `schoolsup_yes` is 1 if yes, 0 if no.
    - `famsup_yes`: Family educational support (yes or no). `famsup_yes` is 1 if yes, 0 if no.
    - `paid_yes`: Extra paid classes within the course subject (yes or no). `paid_yes` is 1 if yes, 0 if no.
    - `activities_yes`: Extra-curricular activities (yes or no). `activities_yes` is 1 if yes, 0 if no.
    - `nursery_yes`: Attended nursery school (yes or no). `nursery_yes` is 1 if yes, 0 if no.
    - `higher_yes`: Wants to take higher education (yes or no). `higher_yes` is 1 if yes, 0 if no.
    - `internet_yes`: Internet access at home (yes or no). `internet_yes` is 1 if yes, 0 if no.
    - `romantic_yes`: In a romantic relationship (yes or no). `romantic_yes` is 1 if yes, 0 if no.

    **Complex Categorical Features (One-Hot Encoded):**
    - `Mjob_health`, `Mjob_other`, `Mjob_services`, `Mjob_teacher`: Mother's job (at_home, health, other, services, teacher). Each is 1 if the mother's job matches, 0 otherwise. `at_home` is the baseline (all others are 0).
    - `Fjob_health`, `Fjob_other`, `Fjob_services`, `Fjob_teacher`: Father's job (same categories as Mjob). `at_home` is the baseline.
    - `reason_home`, `reason_other`, `reason_reputation`: Reason to choose school (course, home, reputation, other). Each is 1 if the reason matches, 0 otherwise. `course` is the baseline.
    - `guardian_mother`, `guardian_other`: Student's guardian (mother, father, other). Each is 1 if the guardian matches, 0 otherwise. `father` is the baseline.

    **Engineered Features:**
    - `Academic_History_Index`: A numerical score reflecting past academic performance and failures. (Higher is better)
      *Logic:* `(G1 + G2) / 2 - failures`
    - `Support_System_Score`: A score indicating the strength of a student's support network. (Higher is better)
      *Logic:* `Medu + Fedu + (1 if famsup_yes else 0) + (1 if paid_yes else 0)`
    - `Distraction_Index`: A measure of potential distractions in a student's life. (Lower is better)
      *Logic:* `goout + Dalc + Walc`
    """
    )
