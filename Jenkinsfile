pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker.io/davaputra'  // Ganti dengan registry kamu (Docker Hub, GCR, ECR, dll)
        DOCKER_CREDENTIALS = 'docker-credentials-id'
        KUBECONFIG_CREDENTIALS = 'kubeconfig-credentials-id'
        IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
    }
    
    parameters {
        choice(name: 'ENVIRONMENT', choices: ['staging', 'production'], description: 'Target environment')
        booleanParam(name: 'DEPLOY_BACKEND', defaultValue: true, description: 'Deploy Backend')
        booleanParam(name: 'DEPLOY_USER_DASHBOARD', defaultValue: true, description: 'Deploy User Dashboard')
        booleanParam(name: 'DEPLOY_ADMIN_DASHBOARD', defaultValue: true, description: 'Deploy Admin Dashboard')
        booleanParam(name: 'DEPLOY_HOMEPAGE', defaultValue: true, description: 'Deploy Homepage')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                }
            }
        }
        
        stage('Set Environment Variables') {
            steps {
                script {
                    if (params.ENVIRONMENT == 'production') {
                        env.NAMESPACE = 'rtrwnet-prod'
                        env.API_URL = 'https://api.fureup.my.id/api/v1'
                        env.K8S_DIR = 'k8s/production'
                    } else {
                        env.NAMESPACE = 'rtrwnet-staging'
                        env.API_URL = 'https://api-staging.fureup.my.id/api/v1'
                        env.K8S_DIR = 'k8s/staging'
                    }
                }
            }
        }
        
        stage('Build Images') {
            parallel {
                stage('Build Backend') {
                    when {
                        expression { params.DEPLOY_BACKEND }
                    }
                    steps {
                        script {
                            docker.build("${DOCKER_REGISTRY}/rtrwnet-backend:${IMAGE_TAG}", "./Backend")
                        }
                    }
                }
                
                stage('Build User Dashboard') {
                    when {
                        expression { params.DEPLOY_USER_DASHBOARD }
                    }
                    steps {
                        script {
                            docker.build(
                                "${DOCKER_REGISTRY}/rtrwnet-user-dashboard:${IMAGE_TAG}",
                                "--build-arg VITE_API_BASE_URL=${env.API_URL} ./Frontend/UserDashboard"
                            )
                        }
                    }
                }
                
                stage('Build Admin Dashboard') {
                    when {
                        expression { params.DEPLOY_ADMIN_DASHBOARD }
                    }
                    steps {
                        script {
                            docker.build(
                                "${DOCKER_REGISTRY}/rtrwnet-admin-dashboard:${IMAGE_TAG}",
                                "--build-arg VITE_API_URL=${env.API_URL} ./Frontend/AdminDashboard"
                            )
                        }
                    }
                }
                
                stage('Build Homepage') {
                    when {
                        expression { params.DEPLOY_HOMEPAGE }
                    }
                    steps {
                        script {
                            docker.build(
                                "${DOCKER_REGISTRY}/rtrwnet-homepage:${IMAGE_TAG}",
                                "--build-arg VITE_API_BASE_URL=${env.API_URL} ./Frontend/HomePage"
                            )
                        }
                    }
                }
            }
        }
        
        stage('Push Images') {
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS) {
                        if (params.DEPLOY_BACKEND) {
                            docker.image("${DOCKER_REGISTRY}/rtrwnet-backend:${IMAGE_TAG}").push()
                            docker.image("${DOCKER_REGISTRY}/rtrwnet-backend:${IMAGE_TAG}").push('latest')
                        }
                        if (params.DEPLOY_USER_DASHBOARD) {
                            docker.image("${DOCKER_REGISTRY}/rtrwnet-user-dashboard:${IMAGE_TAG}").push()
                            docker.image("${DOCKER_REGISTRY}/rtrwnet-user-dashboard:${IMAGE_TAG}").push('latest')
                        }
                        if (params.DEPLOY_ADMIN_DASHBOARD) {
                            docker.image("${DOCKER_REGISTRY}/rtrwnet-admin-dashboard:${IMAGE_TAG}").push()
                            docker.image("${DOCKER_REGISTRY}/rtrwnet-admin-dashboard:${IMAGE_TAG}").push('latest')
                        }
                        if (params.DEPLOY_HOMEPAGE) {
                            docker.image("${DOCKER_REGISTRY}/rtrwnet-homepage:${IMAGE_TAG}").push()
                            docker.image("${DOCKER_REGISTRY}/rtrwnet-homepage:${IMAGE_TAG}").push('latest')
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS, variable: 'KUBECONFIG')]) {
                    script {
                        // Apply namespace and configs
                        sh """
                            kubectl apply -f ${env.K8S_DIR}/namespace.yaml
                            kubectl apply -f ${env.K8S_DIR}/configmap.yaml
                            kubectl apply -f ${env.K8S_DIR}/secrets.yaml
                        """
                        
                        // Deploy database services (if not exists)
                        sh """
                            kubectl apply -f ${env.K8S_DIR}/postgres.yaml
                            kubectl apply -f ${env.K8S_DIR}/redis.yaml
                        """
                        
                        // Deploy applications with image substitution
                        if (params.DEPLOY_BACKEND) {
                            sh """
                                sed 's/\${DOCKER_REGISTRY}/${DOCKER_REGISTRY}/g; s/\${IMAGE_TAG}/${IMAGE_TAG}/g' ${env.K8S_DIR}/backend.yaml | kubectl apply -f -
                            """
                        }
                        
                        if (params.DEPLOY_USER_DASHBOARD) {
                            sh """
                                sed 's/\${DOCKER_REGISTRY}/${DOCKER_REGISTRY}/g; s/\${IMAGE_TAG}/${IMAGE_TAG}/g' ${env.K8S_DIR}/frontend-user.yaml | kubectl apply -f -
                            """
                        }
                        
                        if (params.DEPLOY_ADMIN_DASHBOARD) {
                            sh """
                                sed 's/\${DOCKER_REGISTRY}/${DOCKER_REGISTRY}/g; s/\${IMAGE_TAG}/${IMAGE_TAG}/g' ${env.K8S_DIR}/frontend-admin.yaml | kubectl apply -f -
                            """
                        }
                        
                        if (params.DEPLOY_HOMEPAGE) {
                            sh """
                                sed 's/\${DOCKER_REGISTRY}/${DOCKER_REGISTRY}/g; s/\${IMAGE_TAG}/${IMAGE_TAG}/g' ${env.K8S_DIR}/frontend-homepage.yaml | kubectl apply -f -
                            """
                        }
                        
                        // Apply ingress
                        sh "kubectl apply -f ${env.K8S_DIR}/ingress.yaml"
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS, variable: 'KUBECONFIG')]) {
                    sh """
                        echo "Waiting for deployments to be ready..."
                        kubectl rollout status deployment/backend -n ${env.NAMESPACE} --timeout=300s || true
                        kubectl rollout status deployment/frontend-user -n ${env.NAMESPACE} --timeout=300s || true
                        kubectl rollout status deployment/frontend-admin -n ${env.NAMESPACE} --timeout=300s || true
                        kubectl rollout status deployment/frontend-homepage -n ${env.NAMESPACE} --timeout=300s || true
                        
                        echo "Current pods:"
                        kubectl get pods -n ${env.NAMESPACE}
                        
                        echo "Current services:"
                        kubectl get svc -n ${env.NAMESPACE}
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo "Deployment successful! Environment: ${params.ENVIRONMENT}"
            // Slack notification (optional)
            // slackSend(color: 'good', message: "Deployment to ${params.ENVIRONMENT} successful!")
        }
        failure {
            echo "Deployment failed!"
            // slackSend(color: 'danger', message: "Deployment to ${params.ENVIRONMENT} failed!")
        }
        always {
            // Cleanup docker images
            sh "docker image prune -f || true"
        }
    }
}
