// ========================================
// CareConnect - Symptom Checker
// ========================================

function openSymptomChecker() {

    const message = document.getElementById("symptomMessage");

    message.innerHTML = `
        <div class="symptom-box">
            <h3>Select Your Symptoms</h3>

            <form id="symptomForm">
                <label><input type="checkbox" name="symptoms" value="fever"> Fever</label>
                <label><input type="checkbox" name="symptoms" value="headache"> Headache</label>
                <label><input type="checkbox" name="symptoms" value="cough"> Cough</label>
                <label><input type="checkbox" name="symptoms" value="stomach pain"> Stomach Pain</label>
                <label><input type="checkbox" name="symptoms" value="skin rash"> Skin Rash</label>
                <label><input type="checkbox" name="symptoms" value="chest pain"> Chest Pain</label>
                <label><input type="checkbox" name="symptoms" value="breathing difficulty"> Breathing Difficulty</label>

                <br>
                <button type="submit" class="primary-button">
                    Analyze Symptoms
                </button>
            </form>

            <div id="result"></div>
        </div>
    `;

    document.getElementById("symptomForm")
        .addEventListener("submit", analyzeSymptoms);
}


async function analyzeSymptoms(event) {

    event.preventDefault();

    const selectedSymptoms = Array.from(
        document.querySelectorAll('input[name="symptoms"]:checked')
    ).map(input => input.value);

    const result = document.getElementById("result");

    if (selectedSymptoms.length === 0) {
        result.innerHTML = "<p>Please select at least one symptom.</p>";
        return;
    }

    if (
        selectedSymptoms.includes("chest pain") ||
        selectedSymptoms.includes("breathing difficulty")
    ) {
        result.innerHTML = `
            <h3>Urgent Medical Attention</h3>
            <p>
                Chest pain or breathing difficulty can be serious.
                Seek immediate medical attention or contact local
                emergency services. Do not wait for an automated
                recommendation.
            </p>
        `;
        return;
    }

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/symptoms/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    symptoms: selectedSymptoms
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Symptom analysis failed");
        }

        result.innerHTML = `
            <div class="result-card">
                <h3>Symptom Analysis Completed</h3>

                <p><strong>Selected Symptoms:</strong>
                    ${data.selected_symptoms.join(", ")}
                </p>

                <p><strong>Suggested Department:</strong>
                    ${data.suggested_department}
                </p>

                <p>${data.disclaimer}</p>
            </div>
        `;

    } catch (error) {
        result.innerHTML = `<p>${error.message}</p>`;
    }
}


// ========================================
// CareConnect - Doctors from MySQL
// ========================================

let doctors = [];

async function displayDoctors() {

    const doctorList = document.getElementById("doctorList");
    const doctorSelect = document.getElementById("selectedDoctor");

    if (!doctorList || !doctorSelect) return;

    doctorList.innerHTML = "<p>Loading doctors...</p>";

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/doctors"
        );

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
            throw new Error(data.message || "Unable to load doctors");
        }

        doctors = data.doctors;

        doctorList.innerHTML = "";

        doctorSelect.innerHTML =
            '<option value="">Select Doctor</option>';

        doctors.forEach(doctor => {

            doctorList.innerHTML += `
                <div class="doctor-card">
                    <div class="doctor-icon">👨‍⚕️</div>

                    <h3>${doctor.name}</h3>
                    <p>${doctor.department}</p>
                    <p>${doctor.qualification || ""}</p>

                    <button class="primary-button"
                        onclick="selectDoctor(${doctor.id})">
                        Book Appointment
                    </button>
                </div>
            `;

            doctorSelect.innerHTML += `
                <option value="${doctor.id}">
                    ${doctor.name} - ${doctor.department}
                </option>
            `;

        });

    } catch (error) {

        doctorList.innerHTML =
            `<p>Unable to load doctors: ${error.message}</p>`;

    }
}


// ========================================
// Select Doctor
// ========================================

function selectDoctor(doctorId) {

    const doctorSelect = document.getElementById("selectedDoctor");

    doctorSelect.value = String(doctorId);

    document.getElementById("appointment")
        .scrollIntoView({ behavior: "smooth" });

}


// ========================================
// Book Appointment - Save to MySQL
// ========================================

const appointmentForm =
    document.getElementById("appointmentForm");

if (appointmentForm) {

    appointmentForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const patientName =
            document.getElementById("patientName").value.trim();

        const patientPhone =
            document.getElementById("patientPhone").value.trim();

        const doctorId =
            Number(document.getElementById("selectedDoctor").value);

        const appointmentDate =
            document.getElementById("appointmentDate").value;

        const appointmentTime =
            document.getElementById("appointmentTime").value;

        const result =
            document.getElementById("bookingResult");

        const doctor = doctors.find(item => item.id === doctorId);

        if (!patientName || !patientPhone || !doctor ||
            !appointmentDate || !appointmentTime) {

            result.innerHTML =
                "<p>Please fill in all appointment details.</p>";

            return;
        }

        if (!/^[0-9]{10}$/.test(patientPhone)) {

            result.innerHTML =
                "<p>Please enter a valid 10-digit mobile number.</p>";

            return;
        }

        const selectedDateTime = new Date(
            appointmentDate + "T" + appointmentTime
        );

        if (selectedDateTime <= new Date()) {

            result.innerHTML =
                "<p>Please select a future appointment date and time.</p>";

            return;
        }

        result.innerHTML = "<p>Booking your appointment...</p>";

        try {

            const response = await fetch(
                "http://127.0.0.1:5000/api/appointments", {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        patient_name: patientName,
                        patient_phone: patientPhone,
                        doctor_id: doctorId,
                        appointment_date: appointmentDate,
                        appointment_time: appointmentTime
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || data.status !== "success") {
                throw new Error(
                    data.message || "Appointment booking failed"
                );
            }

            const appointment = data.appointment;

            result.innerHTML = `
                <div class="result-card">

                    <h3>Appointment Booked Successfully!</h3>

                    <p><strong>Appointment ID:</strong>
                        ${appointment.appointment_id}
                    </p>

                    <p><strong>Patient:</strong>
                        ${appointment.patient_name}
                    </p>

                    <p><strong>Doctor:</strong>
                        ${appointment.doctor_name}
                    </p>

                    <p><strong>Department:</strong>
                        ${appointment.department}
                    </p>

                    <p><strong>Date:</strong>
                        ${appointment.appointment_date}
                    </p>

                    <p><strong>Time:</strong>
                        ${appointment.appointment_time}
                    </p>

                    <p><strong>Status:</strong>
                        ${appointment.status}
                    </p>

                    <p>Your appointment request has been saved successfully.</p>

                </div>
            `;

            this.reset();

        } catch (error) {

            result.innerHTML = `
                <div class="result-card">
                    <h3>Booking Failed</h3>
                    <p>${error.message}</p>
                </div>
            `;

        }

    });

}


// ========================================
// Load Doctors When Page Opens
// ========================================

displayDoctors();