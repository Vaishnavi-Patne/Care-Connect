
pipeline {
    agent any

    environment {
        KUBECONFIG = 'C:\\ProgramData\\Jenkins\\kubeconfig\\config'
    }

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

        stage('Test Kubernetes Access') {
            steps {
                echo 'Checking Jenkins connection to Minikube'
                bat '"C:\\Users\\97335\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\kubectl.exe" get nodes'
                bat '"C:\\Users\\97335\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\kubectl.exe" get pods'
            }
        }

        stage('Build Successful') {
            steps {
                echo 'CareConnect Docker image built successfully!'
            }
        }
    }
}
