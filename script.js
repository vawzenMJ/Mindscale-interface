
// The URL of your deployed Flask API on Render
const API_URL = "https://mental-model.onrender.com/predict"; 

// --- Recommendation and Coping Data (Kept Local for Fast Display) ---
const RECOMMENDATIONS = {
    "High Risk": {
        colorClass: "result-high",
        advice: "Immediate and professional care is strongly recommended. Your scores indicate significant current stressors or risk factors.",
        copingTips: [
            "Seek Professional Help Immediately:Contact a licensed therapist, counselor, or psychiatrist.",
            "Use Crisis Resources:Reach out to a trusted crisis hotline or emergency service if you feel unsafe or overwhelmed.",
            "Establish Safety:Identify one trusted person you can call and create a small safety plan (e.g., remove immediate stressors or harmful items).",
            "Simplify Routines:Focus only on essential self-care: eating small meals, drinking water, and aiming for consistent sleep.",
            "Limit Demands:Delegate tasks and reduce immediate stressors (work, social obligations) wherever possible."
        ]
    },
    "Stable (Moderate Risk)": {
        colorClass: "result-stable",
        advice: "You are generally stable, but watch for escalating stress. Focus on robust self-care and stress management.",
        copingTips: [
            "Establish a Routine:Maintain a consistent sleep schedule (7-9 hours) and regular mealtimes.",
            "Practice Mindfulness:Incorporate daily meditation, deep breathing exercises, or gentle stretching.",
            "Build Social Resilience:Maintain a balance between social activity and quiet time to prevent burnout.",
            "Set Boundaries:Learn to say 'no' to commitments that deplete your energy.",
            "Consider Proactive Support:Consult a therapist or counselor for preventative mental wellness strategies."
        ]
    },
    "Low Risk": {
        colorClass: "result-low",
        advice: "Continue your healthy practices. Your mental wellness assessment is currently strong.",
        copingTips: [
            "Prioritize Physical Health:Maintain a balanced diet and regular, moderate exercise.",
            "Nurture Connections:Maintain strong social connections and actively network with friends and family.",
            "Engage in Hobbies:Regularly participate in hobbies, creative outlets, and activities that bring genuine joy.",
            "Continuous Learning:Learn a new skill or challenge your mind regularly to maintain cognitive flexibility.",
            "Reflect and Plan:Keep a journal or practice gratitude to maintain perspective and emotional balance."
        ]
    }
};

function getRadioButtonValue(name) {
    const radios = document.getElementsByName(name);
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null; 
}

async function calculateRisk() {
    const resultDiv = document.getElementById('result');
    resultDiv.className = '';
    resultDiv.innerHTML = '<h2>Loading Assessment...</h2>';
    resultDiv.classList.remove('show');
    
    const form = document.getElementById('assessment-form');
    let userInputs = {};
    let allAnswered = true;

    // --- 1. Collect and Validate Inputs ---
    // List all input fields from the HTML form (must match feature names used in Python)
    const featureNames = [
        'family_history', 'Mental_Health_History', 'Days_Indoors', 'Mood_Swings', 
        'Growing_Stress', 'Changes_Habits', 'Coping_Struggles', 'Social_Weakness', 
        'Work_Interest', 'treatment', 'care_options', 'mental_health_interview',
        'Gender', 'self_employed' // Include non-scoring features needed for backend OHE
    ];

    featureNames.forEach(feature => {
        let value = null;
        
        const selectElement = document.getElementById(feature);
        
        if (selectElement) {
            value = selectElement.value;
        } else {
            value = getRadioButtonValue(feature);
        }
        
        // Basic check for mandatory questions (the core risk factors)
        if (feature !== 'Gender' && feature !== 'self_employed' && (value === "" || value === null)) {
            allAnswered = false;
            alert(`Please answer the question regarding: ${feature.replace(/_/g, ' ')}`);
        }

        // Send the input value to the backend exactly as the user selected it
        userInputs[feature] = value;
    });

    if (!allAnswered) {
        resultDiv.className = 'result-high';
        resultDiv.innerHTML = "<p style='font-weight: bold;'>Please answer all mandatory questions before calculating the assessment.</p>";
        return;
    }

    // --- 2. Send Data to Render API ---
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userInputs),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const category = data.risk_category; // e.g., "High Risk"
        const score = data.risk_score_prediction; // e.g., 2.0 (the numerical label)
        
        // --- 3. Display Result based on API Response ---
        const rec = RECOMMENDATIONS[category];

        let tipsHtml = rec.copingTips.map(tip => `<li>${tip}</li>`).join('');

        resultDiv.className = rec.colorClass;
        resultDiv.innerHTML = `
            <p class="result-category">${category}</p>
            <p class="result-score">Model Prediction Score: <strong>${score.toFixed(2)}</strong></p>
            
            <h3 style="margin-top: 25px;">Coping and Recommendations</h3>
            <p style="margin-top: 10px; font-style: italic; font-weight: 500;">${rec.advice}</p>
            <ul class="result-list">
                ${tipsHtml}
            </ul>
        `;
        
        // Show the result with a fade-in effect
        resultDiv.classList.add('show');
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

    }catch (error) {
        console.error('Prediction failed:', error);
        resultDiv.className = 'result-high';
        resultDiv.innerHTML = `<p style='font-weight: bold;'>Error: Could not connect to the assessment server.</p><p>Please ensure the backend API is running correctly.</p>`;
        resultDiv.classList.add('show');
    }
}

// Attach event listener to prevent form submission default behavior if user hits Enter
document.getElementById('assessment-form').addEventListener('submit', function(event) {
    event.preventDefault();
    calculateRisk();
});