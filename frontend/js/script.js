// ============================================
// CARECONNECT - FRONTEND JAVASCRIPT
// ============================================

// Local Kubernetes Backend API
const API_URL = "/api";

// ============================================
// DOCTOR PROFILE PICTURES
// ============================================

const doctorImages = {
    "Dr. Rahul Sharma": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500",

    "Dr. Priya Patil": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500",

    "Dr. Amit Kulkarni": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500",

    "Dr. Sneha Desai": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=500",

    "Dr. Ananya Rao": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500"
};

const defaultDoctorImage =
    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=500";

// ============================================
// PAGE LOAD
// ============================================

document.addEventListener("DOMContentLoaded", function() {

    loadDoctors();

    const symptomForm = document.getElementById("symptomForm");

    if (symptomForm) {
        symptomForm.addEventListener("submit", analyzeSymptoms);
    }

    const appointmentForm =
        document.getElementById("appointmentForm") ||
        document.getElementById("appointment");

    if (appointmentForm) {
        appointmentForm.addEventListener("submit", bookAppointment);
    }
});

// ============================================
// 1. LOAD DOCTORS WITH PICTURES
// ============================================

async function loadDoctors() {

    const doctorList = document.getElementById("doctorList");
    const doctorSelect = document.getElementById("selectedDoctor");

    try {

        if (doctorList) {
            doctorList.innerHTML = "<p>Loading doctors...</p>";
        }

        const response = await fetch(`${API_URL}/doctors`);

        if (!response.ok) {
            throw new Error("Doctors API returned an error.");
        }

        const data = await response.json();

        if (!Array.isArray(data.doctors)) {
            throw new Error("Invalid doctors response from server.");
        }

        const doctors = data.doctors;

        // Display doctor cards
        if (doctorList) {

            doctorList.innerHTML = "";

            doctors.forEach(function(doctor) {

                const card = document.createElement("div");
                card.className = "doctor-card";

                const image =
                    doctorImages[doctor.name] || defaultDoctorImage;

                card.innerHTML = `
                    <img
                        src="${image}"
                        alt="${doctor.name}"
                        class="doctor-image"
                        loading="lazy"
                        onerror="this.onerror=null; this.src='${defaultDoctorImage}'"
                    >

                    <h3>${doctor.name}</h3>

                    <p>${doctor.department}</p>

                    <p>
                        ${doctor.qualification ||
                        "Qualification not available"}
                    </p>

                    <button
                        type="button"
                        onclick="selectDoctor(${doctor.id})">
                        Book Appointment
                    </button>
                `;

                doctorList.appendChild(card);

            });
        }

        // Populate appointment dropdown
        if (doctorSelect) {

            doctorSelect.innerHTML =
                '<option value="">Select Doctor</option>';

            doctors.forEach(function(doctor) {

                const option = document.createElement("option");

                option.value = doctor.id;

                option.textContent =
                    doctor.name + " - " + doctor.department;

                doctorSelect.appendChild(option);

            });
        }

        console.log("Doctors loaded successfully:", doctors);

    } catch (error) {

        console.error("Doctor loading error:", error);

        if (doctorList) {
            doctorList.innerHTML =
                "<p>Unable to load doctors. Please check the backend connection.</p>";
        }
    }
}

// ============================================
// 2. SELECT DOCTOR
// ============================================

function selectDoctor(doctorId) {

    const doctorSelect =
        document.getElementById("selectedDoctor");

    if (doctorSelect) {
        doctorSelect.value = String(doctorId);
    }

    const appointmentSection =
        document.getElementById("appointment");

    if (appointmentSection) {

        appointmentSection.scrollIntoView({
            behavior: "smooth"
        });
    }
}

// ============================================
// 3. OPEN SYMPTOM CHECKER
// ============================================

function openSymptomChecker() {

    const symptomMessage =
        document.getElementById("symptomMessage");

    if (!symptomMessage) {
        console.error("Symptom message section not found.");
        return;
    }

    symptomMessage.innerHTML = `
        <form id="symptomForm">

            <h3>Select your symptoms</h3>

            <label>
                <input type="checkbox" name="symptoms" value="Fever">
                Fever
            </label><br>

            <label>
                <input type="checkbox" name="symptoms" value="Headache">
                Headache
            </label><br>

            <label>
                <input type="checkbox" name="symptoms" value="Cough">
                Cough
            </label><br>

            <label>
                <input type="checkbox" name="symptoms" value="Stomach pain">
                Stomach pain
            </label><br>

            <label>
                <input type="checkbox" name="symptoms" value="Skin problem">
                Skin problem
            </label><br>

            <label>
                <input type="checkbox" name="symptoms" value="Chest pain">
                Chest pain
            </label><br>

            <label>
                <input type="checkbox" name="symptoms" value="Breathing difficulty">
                Breathing difficulty
            </label><br><br>

            <button type="submit">Analyze Symptoms</button>

        </form>

        <div id="result"></div>
    `;

    document.getElementById("symptomForm")
        .addEventListener("submit", analyzeSymptoms);
}

// ============================================
// 4. ANALYZE SYMPTOMS
// ============================================

async function analyzeSymptoms(event) {

    event.preventDefault();

    const selectedSymptoms = Array.from(
        document.querySelectorAll(
            'input[name="symptoms"]:checked'
        )
    ).map(function(input) {
        return input.value;
    });

    const result = document.getElementById("result");

    if (selectedSymptoms.length === 0) {

        if (result) {
            result.textContent =
                "Please select at least one symptom.";
        }

        return;
    }

    // Emergency symptom check
    const urgentSymptoms = [
        "chest pain",
        "breathing difficulty"
    ];

    const normalizedSymptoms = selectedSymptoms.map(
        function(symptom) {
            return symptom.toLowerCase().trim();
        }
    );

    const needsUrgentCare = normalizedSymptoms.some(
        function(symptom) {
            return urgentSymptoms.includes(symptom);
        }
    );

    if (needsUrgentCare) {

        if (result) {
            result.innerHTML = `
                <h3>Urgent Medical Attention</h3>

                <p>
                    Chest pain or breathing difficulty can be serious.
                    Please seek emergency medical care immediately.
                </p>
            `;
        }

        return;
    }

    try {

        if (result) {
            result.textContent = "Analyzing your symptoms...";
        }

        const response = await fetch(
            `${API_URL}/symptoms/analyze`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    symptoms: normalizedSymptoms
                })
            }
        );

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(
                data.message || "Symptom analysis failed."
            );
        }

        const department =
            data.department ||
            data.suggested_department ||
            "Please consult a doctor";

        if (result) {

            result.innerHTML = `
                <h3>Symptom Analysis Result</h3>

                <p>
                    ${data.message ||
                    "Symptom analysis completed successfully."}
                </p>

                <p>
                    Suggested Department:
                    <strong>${department}</strong>
                </p>

                <p>
                    <small>
                        This is an educational suggestion,
                        not a medical diagnosis.
                    </small>
                </p>
            `;
        }

    } catch (error) {

        console.error("Symptom analysis error:", error);

        if (result) {
            result.textContent =
                error.message ||
                "Unable to analyze symptoms. Please try again.";
        }
    }
}

// ============================================
// 5. BOOK APPOINTMENT
// ============================================

async function bookAppointment(event) {

    event.preventDefault();

    const patientName =
        document.getElementById("patientName").value.trim();

    const patientPhone =
        document.getElementById("patientPhone").value.trim();

    const doctorId =
        document.getElementById("selectedDoctor").value;

    const appointmentDate =
        document.getElementById("appointmentDate").value;

    const appointmentTime =
        document.getElementById("appointmentTime").value;

    const bookingResult =
        document.getElementById("bookingResult");

    if (!patientName ||
        !patientPhone ||
        !doctorId ||
        !appointmentDate ||
        !appointmentTime
    ) {

        if (bookingResult) {
            bookingResult.textContent =
                "Please fill in all appointment details.";
        }

        return;
    }

    // Validate phone number
    if (!/^[0-9]{10}$/.test(patientPhone)) {

        if (bookingResult) {
            bookingResult.textContent =
                "Please enter a valid 10-digit phone number.";
        }

        return;
    }

    // Validate appointment date and time
    const selectedDateTime = new Date(
        `${appointmentDate}T${appointmentTime}`
    );

    if (selectedDateTime <= new Date()) {

        if (bookingResult) {
            bookingResult.textContent =
                "Please select a future appointment date and time.";
        }

        return;
    }

    const appointmentData = {
        patient_name: patientName,
        patient_phone: patientPhone,
        doctor_id: Number(doctorId),
        appointment_date: appointmentDate,
        appointment_time: appointmentTime
    };

    try {

        if (bookingResult) {
            bookingResult.textContent =
                "Booking your appointment...";
        }

        const response = await fetch(
            `${API_URL}/appointments`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(appointmentData)
            }
        );

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(
                data.message || "Appointment booking failed."
            );
        }

        if (bookingResult) {

            bookingResult.innerHTML = `
                <h3>Appointment Request Successful!</h3>

                <p>
                    ${data.message ||
                    "Your appointment has been booked."}
                </p>

                <p>
                    Appointment ID:
                    <strong>
                        ${data.appointment_id || data.id || "Confirmed"}
                    </strong>
                </p>

                <p>
                    Status: ${data.status || "Pending"}
                </p>
            `;
        }

    } catch (error) {

        console.error("Appointment booking error:", error);

        if (bookingResult) {
            bookingResult.textContent =
                error.message ||
                "Unable to book appointment.";
        }
    }
}

// ============================================
// END OF CARECONNECT JAVASCRIPT
// ============================================