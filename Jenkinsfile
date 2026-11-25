
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'CareConnect source code is ready'
                bat 'git --version'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t careconnect-backend:jenkins ./backend'
            }
        }

        stage('Build Successful') {
            steps {
                echo 'CareConnect Docker image built successfully!'
            }
        }
    }
}
