// The URL of your deployed Flask API on Render
const API_URL = "https://mental-model.onrender.com/predict"; 

// --- Recommendation and Coping Data (Tailored for DeKUT Staff) ---
const RECOMMENDATIONS = {
    "High Risk": {
        colorClass: "result-high",
        advice: "DeKUT values your well-being. Your assessment indicates significant strain. Immediate and professional care is strongly recommended.",
        copingTips: [
            "Visit DeKUT Medical Center: Located at the Main Campus for immediate clinical consultation.",
            "Contact University Counselor: Schedule a priority confidential session via the Directorate of Student Welfare.",
            "Emergency Contact: Reach out to the DeKUT security/emergency line if you feel in immediate crisis.",
            "Staff Leave: Consult your Head of Department (HoD) regarding the university's wellness leave policy.",
            "Safety Plan: Identify a trusted colleague or family member you can speak with right now."
        ]
    },
    "Stable (Moderate Risk)": {
        colorClass: "result-stable", // This will trigger the Gold/Yellow color
        advice: "You are generally stable, but institutional stress may be rising. Focus on robust self-care and professional boundaries.",
        copingTips: [
            "DeKUT Wellness Friday: Join the staff sports sessions held every Friday afternoon at the campus grounds.",
            "Practice Mindfulness: Use the 'Right to Disconnect'avoid work emails after 5:00 PM and on weekends.",
            "Campus Nature: Take a 15-minute walk around the DeKUT Conservancy to clear your mind.",
            "Set Boundaries: Learn to say 'no' to extra administrative tasks that deplete your energy.",
            "Consult HR: Explore DeKUT's staff support initiatives and professional development workshops."
        ]
    },
    "Low Risk": {
        colorClass: "result-low", // This will trigger the Green color
        advice: "Your mental wellness is currently strong. Continue your healthy practices and support your peers in the DeKUT community.",
        copingTips: [
            "Maintain Connections: Keep actively networking with friends and fellow staff members.",
            "Physical Health: Maintain a balanced diet and use the university's recreational facilities regularly.",
            "Engage in Hobbies: Participate in creative outlets or community projects that bring you joy.",
            "Continuous Learning: Engage with DeKUT’s research and innovation forums to keep your mind flexible.",
            "Reflect and Plan: Keep a gratitude journal to maintain your positive emotional balance."
        ]
    }
};

/**
 * Helper to get value from Radio Buttons
 */
function getRadioButtonValue(name) {
    const radios = document.getElementsByName(name);
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null; 
}

/**
 * Main function to handle Assessment and API Call
 */
async function calculateRisk() {
    // 1. Disclaimer Validation Check
    const consent = document.getElementById('consent-check');
    if (!consent.checked) {
        alert("Please acknowledge the Medical Disclaimer before proceeding.");
        return;
    }

    const resultPage = document.getElementById('result-page');
    const analysisContent = document.getElementById('analysis-content');
    const submitBtn = document.querySelector('.submit-btn');
    const form = document.getElementById('assessment-form');

    // 2. Initial UI Feedback
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Processing DeKUT Staff Diagnostic...";
    submitBtn.disabled = true;

    let userInputs = {};
    let allAnswered = true;

    // --- 3. Collect and Validate Inputs ---
    const featureNames = [
        'family_history', 'Mental_Health_History', 'Days_Indoors', 'Mood_Swings', 
        'Growing_Stress', 'Changes_Habits', 'Coping_Struggles', 'Social_Weakness', 
        'Work_Interest', 'treatment', 'care_options', 'mental_health_interview',
        'Gender', 'self_employed' 
    ];

    featureNames.forEach(feature => {
        let value = null;
        const selectElement = document.querySelector(`select[name="${feature}"]`);
        
        if (selectElement) {
            value = selectElement.value;
        } else {
            value = getRadioButtonValue(feature);
        }
        
        if (feature !== 'Gender' && feature !== 'self_employed' && (value === "" || value === null)) {
            allAnswered = false;
        }

        userInputs[feature] = value;
    });

    if (!allAnswered) {
        alert("DeKUT Portal: Please answer all questions to receive an accurate assessment.");
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
        return;
    }

    // --- 4. Send Data to Render API ---
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
        
        const category = data.risk_category || data.prediction; 
        const scoreRaw = data.risk_score_prediction || data.score || 0;
        
        // Convert decimal to Percentage for display
        const percentageScore = (scoreRaw * 100).toFixed(0); 

        // Match the model output to localized recommendations
        const rec = RECOMMENDATIONS[category] || RECOMMENDATIONS["Stable (Moderate Risk)"];

        let tipsHtml = rec.copingTips.map(tip => `<li>${tip}</li>`).join('');

        // --- 5. Injected Results Hierarchy (Name -> Status -> Percentage -> Tips) ---
        analysisContent.innerHTML = `
            <div class="result-header-block">
                <p class="result-name-header">System: DeKUT Staff Wellness Portal</p>
                <h1 class="result-status-text ${rec.colorClass}">Status: ${category}</h1>
                <p class="result-score-badge">Assessment Match: <strong>${percentageScore}%</strong></p>
            </div>
            
            <div style="margin-top: 20px; padding: 20px; background: white; border-radius: 12px; border-left: 6px solid var(--dekut-blue);">
                <h2 style="font-size: 1.2rem; color: #1e293b;">Institutional Analysis</h2>
                <p style="font-size: 1rem; line-height: 1.5; margin-top: 8px; color: #475569;">"${rec.advice}"</p>
            </div>

            <h3 style="margin-top: 25px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid var(--dekut-gold); display: inline-block;">
                Your Action Plan
            </h3>
            <ul class="result-list">
                ${tipsHtml}
            </ul>
        `;
        
        // Show result overlay
        resultPage.classList.remove('hidden');
        window.scrollTo(0, 0);

    } catch (error) {
        console.error('Prediction failed:', error);
        alert("Connectivity Error: Could not reach the DeKUT Wellness server. Please check your internet or try again later.");
    } finally {
        submitBtn.innerText = "Run Assessment";
        submitBtn.disabled = false;
    }
}

function closeResult() {
    document.getElementById('result-page').classList.add('hidden');
}

document.getElementById('assessment-form').addEventListener('submit', function(event) {
    event.preventDefault();
    calculateRisk();
});