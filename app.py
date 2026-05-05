import streamlit as st
import pandas as pd

st.title("EduFeed Dashboard")

# Upload CSV
file = st.file_uploader("Upload your dataset", type=["csv"])

try:
    if file:
        df = pd.read_csv(file)
    else:
        df = pd.read_csv("trial-upload-10rows.csv")

    st.write("Dataset Preview", df.head())

    if "sentiment" in df.columns:
        st.write("Sentiment Distribution")
        st.bar_chart(df["sentiment"].value_counts())

except Exception as e:
    st.error(f"Error loading file: {e}")