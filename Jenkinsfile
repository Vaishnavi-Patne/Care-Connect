
pipeline {
    agent any

    environment {
        KUBECONFIG = 'C:\\ProgramData\\Jenkins\\kubeconfig\\config'
        MINIKUBE_HOME = 'C:\\Users\\97335\\.minikube'
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
                echo 'Building CareConnect backend image'
                bat 'docker build -t careconnect-backend:jenkins ./backend'
            }
        }

        stage('Load Image into Minikube') {
            steps {
                echo 'Loading Docker image into Minikube'
                bat '"C:\\Program Files\\Kubernetes\\Minikube\\minikube.exe" image load careconnect-backend:jenkins'
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo 'Applying Kubernetes deployment'
                bat '"C:\\Users\\97335\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\kubectl.exe" apply -f k8s/deployment.yaml'

                echo 'Applying Kubernetes service'
                bat '"C:\\Users\\97335\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\kubectl.exe" apply -f k8s/service.yaml'

                echo 'Restarting CareConnect backend'
                bat '"C:\\Users\\97335\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\kubectl.exe" rollout restart deployment/careconnect-backend'

                echo 'Waiting for deployment'
                bat '"C:\\Users\\97335\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin\\kubectl.exe" rollout status deployment/careconnect-backend --timeout=120s'
            }
        }

        stage('Build Successful') {
            steps {
                echo 'CareConnect CI/CD deployment completed successfully!'
            }
        }
    }
}
