
import os

from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from sqlalchemy.engine import URL
from werkzeug.security import generate_password_hash, check_password_hash

from database.db_config import get_db_connection


# Load environment variables from .env
load_dotenv()

app = Flask(__name__)


# --------------------------------
# MySQL Database Configuration
# --------------------------------

mysql_user = os.getenv("CARECONNECT_DB_USER", "careconnect_app")
mysql_password = os.getenv("CARECONNECT_APP_DB_PASSWORD")

if not mysql_password:
    raise RuntimeError(
        "Please set the CARECONNECT_APP_DB_PASSWORD environment variable."
    )

database_url = URL.create(
    drivername="mysql+pymysql",
    username=mysql_user,
    password=mysql_password,
    host=os.getenv("CARECONNECT_DB_HOST", "localhost"),
    port=int(os.getenv("CARECONNECT_DB_PORT", "3306")),
    database="careconnect"
)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

CORS(app)


# --------------------------------
# Home API
# --------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Welcome to CareConnect Healthcare Platform",
        "status": "Backend is running successfully"
    }), 200


# --------------------------------
# Health Check API
# --------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "Healthy",
        "application": "CareConnect",
        "message": "Server is working properly"
    }), 200


# --------------------------------
# Patient Registration API
# --------------------------------

@app.route("/api/patients/register", methods=["POST"])
def register_patient():

    data = request.get_json(silent=True) or {}

    full_name = data.get("full_name")
    email = data.get("email")
    phone = data.get("phone")
    age = data.get("age")
    gender = data.get("gender")
    password = data.get("password")

    if not all([full_name, email, password]):
        return jsonify({
            "error": "Name, email and password are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must contain at least 8 characters"
        }), 400

    password_hash = generate_password_hash(password)

    try:
        result = db.session.execute(
            text("""
                INSERT INTO patients
                (full_name, email, phone, age, gender, password_hash)
                VALUES
                (:name, :email, :phone, :age, :gender, :password_hash)
            """),
            {
                "name": full_name,
                "email": email,
                "phone": phone,
                "age": age,
                "gender": gender,
                "password_hash": password_hash
            }
        )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Patient registered successfully",
            "patient_id": result.lastrowid
        }), 201

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------
# Patient Login API
# --------------------------------

@app.route("/api/patients/login", methods=["POST"])
def login_patient():

    data = request.get_json(silent=True) or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    try:
        patient = db.session.execute(
            text("""
                SELECT id, full_name, email, password_hash
                FROM patients
                WHERE email = :email
            """),
            {"email": email}
        ).mappings().first()

        if not patient or not patient["password_hash"]:
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        if not check_password_hash(
            patient["password_hash"], password
        ):
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        return jsonify({
            "status": "success",
            "message": "Login successful",
            "patient": {
                "id": patient["id"],
                "full_name": patient["full_name"],
                "email": patient["email"]
            }
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------
# Get All Doctors API
# Database: careconnect_db
# --------------------------------

@app.route("/api/doctors", methods=["GET"])
def get_doctors():

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "status": "error",
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                doctor_id AS id,
                doctor_name AS name,
                department,
                qualification
            FROM doctors
        """)

        doctors = cursor.fetchall()

        return jsonify({
            "status": "success",
            "doctors": doctors
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()

        connection.close()


# --------------------------------
# Book Appointment API
# Database: careconnect_db
# --------------------------------

@app.route("/api/appointments", methods=["POST"])
def book_appointment():

    data = request.get_json(silent=True) or {}

    patient_name = data.get("patient_name")
    patient_phone = data.get("patient_phone")
    doctor_id = data.get("doctor_id")
    appointment_date = data.get("appointment_date")
    appointment_time = data.get("appointment_time")

    if not all([
        patient_name,
        patient_phone,
        doctor_id,
        appointment_date,
        appointment_time
    ]):
        return jsonify({
            "status": "error",
            "message": "All appointment fields are required"
        }), 400

    if not str(patient_phone).isdigit() or len(str(patient_phone)) != 10:
        return jsonify({
            "status": "error",
            "message": "Enter a valid 10-digit phone number"
        }), 400

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "status": "error",
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        # Verify that the selected doctor exists
        cursor.execute(
            "SELECT doctor_id, doctor_name, department "
            "FROM doctors WHERE doctor_id = %s",
            (doctor_id,)
        )

        doctor = cursor.fetchone()

        if not doctor:
            return jsonify({
                "status": "error",
                "message": "Selected doctor was not found"
            }), 404

        # Save patient details
        cursor.execute(
            """
            INSERT INTO patients (patient_name, phone)
            VALUES (%s, %s)
            """,
            (patient_name, patient_phone)
        )

        patient_id = cursor.lastrowid

        # Save appointment details
        cursor.execute(
            """
            INSERT INTO appointments
            (patient_id, doctor_id, appointment_date,
             appointment_time, status)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                patient_id,
                doctor_id,
                appointment_date,
                appointment_time,
                "Pending"
            )
        )

        appointment_id = cursor.lastrowid

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Appointment booked successfully",
            "appointment": {
                "appointment_id": appointment_id,
                "patient_id": patient_id,
                "patient_name": patient_name,
                "doctor_name": doctor["doctor_name"],
                "department": doctor["department"],
                "appointment_date": str(appointment_date),
                "appointment_time": str(appointment_time),
                "status": "Pending"
            }
        }), 201

    except Exception as e:
        connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        if cursor:
            cursor.close()

        connection.close()


# --------------------------------
# Symptom Analysis API
# --------------------------------

@app.route("/api/symptoms/analyze", methods=["POST"])
def analyze_symptoms():

    data = request.get_json(silent=True) or {}

    symptoms = data.get("symptoms", [])

    if not isinstance(symptoms, list):
        return jsonify({
            "error": "Symptoms must be provided as a list"
        }), 400

    allowed_symptoms = {
        "fever",
        "headache",
        "cough",
        "stomach pain",
        "skin rash",
        "chest pain",
        "breathing difficulty"
    }

    if not symptoms:
        return jsonify({
            "error": "Please select at least one symptom"
        }), 400

    if not all(
        isinstance(symptom, str) and symptom in allowed_symptoms
        for symptom in symptoms
    ):
        return jsonify({
            "error": "Invalid symptom selection"
        }), 400

    if (
        "chest pain" in symptoms
        or "breathing difficulty" in symptoms
    ):
        return jsonify({
            "status": "urgent",
            "message": (
                "Seek immediate medical attention. "
                "Do not wait for an automated recommendation."
            )
        }), 200

    department = "General Medicine"

    if "skin rash" in symptoms:
        department = "Dermatology"

    elif "stomach pain" in symptoms:
        department = "Gastroenterology"

    elif "headache" in symptoms:
        department = "Neurology"

    return jsonify({
        "status": "success",
        "selected_symptoms": symptoms,
        "suggested_department": department,
        "disclaimer": (
            "This is an educational rule-based suggestion, "
            "not a medical diagnosis."
        )
    }), 200


# --------------------------------
# SQLAlchemy Database Connection Test
# --------------------------------

def test_database_connection():

    with app.app_context():

        result = db.session.execute(
            text("SELECT DATABASE()")
        ).scalar()

        print("Connected Database:", result)


# --------------------------------
# Run Flask Application
# --------------------------------

if __name__ == "__main__":

    test_database_connection()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
