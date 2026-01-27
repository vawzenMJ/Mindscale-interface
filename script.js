// 1. Configuration: URL of your deployed Flask API on Render
const API_URL = "https://mental-model.onrender.com/predict"; 

// 2. Comprehensive Recommendation Database for Students and Staff
const RECOMMENDATIONS = {
    "High Risk": {
        colorClass: "result-high",
        advice: "DeKUT values your well-being. Your assessment indicates significant strain. Immediate care is strongly recommended.",
        student: [
            "Visit DeKUT Medical Center: Located near the main gate for immediate clinical consultation.",
            "Contact University Counselor: Schedule a priority session via the Directorate of Student Welfare.",
            "Dean of Students: Reach out for academic or financial intervention if that is causing stress.",
            "Peer Mentors: Connect with the DeKUT Peer Mentors group for student-to-student support.",
            "Emergency Contact: Call the DeKUT security hotline if you feel in immediate crisis."
        ],
        staff: [
            "Visit DeKUT Medical Center: Immediate clinical consultation for staff is available.",
            "Staff Wellness Committee: Contact your departmental wellness representative.",
            "HoD Consultation: Discuss wellness leave or workload adjustment with your Head of Department.",
            "Professional Counseling: Access the staff-specific psychological support program.",
            "Emergency Contact: Use the internal DeKUT staff emergency extension line."
        ]
    },
    "Stable (Moderate Risk)": {
        colorClass: "result-stable",
        advice: "You are generally stable, but institutional stress may be rising. Focus on robust self-care and professional/academic boundaries.",
        student: [
            "Academic Balance: Visit the library's quiet zones to manage study-related anxiety.",
            "Student Clubs: Join a club (like the Tech Club or Sports) to reduce social isolation.",
            "Counseling Center: Attend a 'Talk-it-Out' session organized by the welfare department.",
            "Physical Activity: Use the university gym or the basketball court regularly.",
            "Healthy Habits: Ensure you aren't skipping meals during the CATs/Exam season."
        ],
        staff: [
            "Wellness Friday: Join staff sports sessions held every Friday afternoon at the campus grounds.",
            "Right to Disconnect: Avoid responding to work-related messages or emails after 5:00 PM.",
            "Conservancy Walk: Take a 15-minute break at the DeKUT Conservancy to recharge your mind.",
            "HR Workshops: Participate in the upcoming 'Mental Health at Work' staff seminars.",
            "Set Boundaries: Evaluate your administrative load and delegate tasks where possible."
        ]
    },
    "Low Risk": {
        colorClass: "result-low",
        advice: "Your mental wellness is currently strong. Continue your healthy practices and support your peers in the DeKUT community.",
        student: [
            "Peer Support: Be a 'buddy' to a fellow student who might be struggling.",
            "Innovation Hub: Channel your energy into creative projects at the DeKUT Hub (DeHUB).",
            "Maintain Routine: Keep a consistent sleep schedule even during busy academic weeks.",
            "Outdoor Study: Utilize the green spaces around campus for fresh air while reading."
        ],
        staff: [
            "Staff Mentorship: Consider mentoring a junior staff member or a student.",
            "Research Forums: Keep your mind sharp by engaging in DeKUT’s weekly research seminars.",
            "Work-Life Harmony: Maintain the positive habits that are currently working for you.",
            "Community Leadership: Lead a small wellness or social initiative within your department."
        ]
    }
};

/**
 * Helper to get value from Radio Buttons
 */
function getRadioButtonValue(name) {
    const radio = document.querySelector(`input[name="${name}"]:checked`);
    return radio ? radio.value : null;
}

/**
 * Main Assessment Function
 */
async function calculateRisk() {
    console.log("Assessment Triggered...");

    // 3. Elements and Validation
    const roleEl = document.getElementById('user_role');
    const consentEl = document.getElementById('consent-check');
    const submitBtn = document.querySelector('.submit-btn');
    const analysisContent = document.getElementById('analysis-content');
    const resultPage = document.getElementById('result-page');

    if (!roleEl || !roleEl.value) {
        alert("Please select whether you are a Student or Staff member.");
        return;
    }
    if (!consentEl || !consentEl.checked) {
        alert("Please acknowledge the Medical Disclaimer.");
        return;
    }

    const userRole = roleEl.value;

    // UI Feedback: Loading State
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Analyzing Community Data...";
    submitBtn.disabled = true;

    // 4. Data Collection & Feature Mapping
    let userInputs = {};
    let missingFields = [];
    const features = [
        'family_history', 'Mental_Health_History', 'Days_Indoors', 'Mood_Swings', 
        'Growing_Stress', 'Changes_Habits', 'Coping_Struggles', 'Social_Weakness', 
        'Work_Interest', 'treatment', 'care_options', 'mental_health_interview'
    ];

    features.forEach(f => {
        const el = document.querySelector(`[name="${f}"]`);
        // Check if it's a dropdown (select) or a radio button group
        const val = (el && el.tagName === "SELECT") ? el.value : getRadioButtonValue(f);
        
        if (!val) missingFields.push(f.replace(/_/g, ' '));
        userInputs[f] = val;
    });

    // Add required static fields for the AI Model
    userInputs['Gender'] = "Male";
    userInputs['self_employed'] = "No";

    if (missingFields.length > 0) {
        alert("Please answer all questions. Missing: " + missingFields.join(", "));
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        return;
    }

    console.log("Submitting to AI:", userInputs);
    
    

    // 5. API Communication (Model Analysis)
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userInputs),
        });

        if (!response.ok) throw new Error("API Offline/Error");

        const data = await response.json();
        console.log("API Result:", data);

        // Extracting prediction results from AI response
        const category = data.risk_category || data.prediction || "Low Risk";
        const scoreRaw = data.risk_score_prediction || data.score || 0;
        const percentage = (scoreRaw * 100).toFixed(0);

        // 6. Recommendation Engine (Matching Role to Risk)
        const recData = RECOMMENDATIONS[category] || RECOMMENDATIONS["Stable (Moderate Risk)"];
        const tips = userRole === 'student' ? recData.student : recData.staff;
        let tipsHtml = tips.map(tip => `<li>${tip}</li>`).join('');

        // 7. Injecting Results into the HTML
        analysisContent.innerHTML = `
            <div class="result-header-block">
                <p class="result-name-header">DeKUT ${userRole.toUpperCase()} ASSESSMENT</p>
                <h1 class="result-status-text ${recData.colorClass}">${category}</h1>
                <p class="result-score-badge">Model Match: <strong>${percentage}%</strong></p>
            </div>
            
            <div style="margin-top: 20px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 6px solid #004a99;">
                <h2 style="font-size: 1.1rem; color: #1e293b;">Institutional Analysis</h2>
                <p style="font-size: 1rem; line-height: 1.5; margin-top: 8px; color: #475569;">"${recData.advice}"</p>
            </div>

            <h3 style="margin-top: 25px; font-size: 1.1rem; color: #1e293b; border-bottom: 2px solid #f2b411; display: inline-block;">
                ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Action Plan
            </h3>
            <ul class="result-list" style="margin-top: 15px;">
                ${tipsHtml}
            </ul>
        `;

        // Reveal the result overlay
        resultPage.classList.remove('hidden');
        window.scrollTo(0, 0);

    } catch (error) {
        console.error("Fetch Error:", error);
        alert("The DeKUT AI server is currently waking up or offline. Please wait 30 seconds and try again.");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Result Overlay Control
 */
function closeResult() {
    document.getElementById('result-page').classList.add('hidden');
}

/**
 * Initializer: Attach Events when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('assessment-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Stop page from refreshing
            calculateRisk();
        });
    }
});