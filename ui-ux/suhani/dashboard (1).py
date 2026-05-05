import streamlit as st

# 1. THE DATA: This is your "Static JSON" skeleton
# This matches the numbers and categories in your Figma design
dashboard_data = {
    "metrics": {
        "Total Responses": "1,284",
        "Average Rating": "4.2/5",
        "Response Rate": "78%",
        "Students Reached": "1648"
    },
    "sentiment": {
        "Positive": 60,
        "Negative": 25,
        "Neutral": 15
    }
}

# 2. THE PAGE SETUP
st.set_page_config(page_title="Feedback Dashboard", layout="wide")

# 3. TITLE AND SUMMARY
st.title("STUDENT FEEDBACK ANALYSIS DASHBOARD")
st.markdown("Overview of feedback collected across all courses this semester")
st.write("---")

# 4. KPI CARDS (The four boxes at the top of your Figma)
col1, col2, col3, col4 = st.columns(4)
metrics = list(dashboard_data["metrics"].items())

col1.metric(metrics[0][0], metrics[0][1])
col2.metric(metrics[1][0], metrics[1][1])
col3.metric(metrics[2][0], metrics[2][1])
col4.metric(metrics[3][0], metrics[3][1])

st.write("---")

# 5. SENTIMENT CIRCLES (Represented as labeled columns here)
st.subheader("SENTIMENT DISTRIBUTION")
sent_col1, sent_col2, sent_col3 = st.columns(3)

with sent_col1:
    st.success(f"Positive Feedback: {dashboard_data['sentiment']['Positive']}%")
with sent_col2:
    st.error(f"Negative Feedback: {dashboard_data['sentiment']['Negative']}%")
with sent_col3:
    st.info(f"Neutral Feedback: {dashboard_data['sentiment']['Neutral']}%")

# 6. CHARTS (The skeleton for your trend and distribution graphs)
st.write("---")
left_chart, right_chart = st.columns(2)

with left_chart:
    st.subheader("Feedback Trend Over Time")
    # Using simple mock data to match your line graph
    st.line_chart([20, 30, 25, 45, 58, 25])

with right_chart:
    st.subheader("Rating Distribution")
    # Using simple mock data to match your bar chart (1-5 stars)
    st.bar_chart([8, 14, 22, 35, 57])