pipeline {
    agent any

    environment {
        DOCKER_REPO = 'davaputra'
        DOCKER_CREDENTIALS = 'docker-credentials-id'
        KUBECONFIG_CREDENTIALS = 'kubeconfig-credentials-id'
        IMAGE_TAG = "${BUILD_NUMBER}-${GIT_COMMIT?.take(7) ?: 'dev'}"
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
            }
        }

        stage('Set Environment') {
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
            steps {
                script {

                    if (params.DEPLOY_BACKEND) {
                        backendImage = docker.build(
                            "${DOCKER_REPO}/rtrwnet-backend:${IMAGE_TAG}",
                            "./Backend"
                        )
                    }

                    if (params.DEPLOY_USER_DASHBOARD) {
                        userDashboardImage = docker.build(
                            "${DOCKER_REPO}/rtrwnet-user-dashboard:${IMAGE_TAG}",
                            "--build-arg VITE_API_BASE_URL=${env.API_URL} ./Frontend/UserDashboard"
                        )
                    }

                    if (params.DEPLOY_ADMIN_DASHBOARD) {
                        adminDashboardImage = docker.build(
                            "${DOCKER_REPO}/rtrwnet-admin-dashboard:${IMAGE_TAG}",
                            "--build-arg VITE_API_URL=${env.API_URL} ./Frontend/AdminDashboard"
                        )
                    }

                    if (params.DEPLOY_HOMEPAGE) {
                        homepageImage = docker.build(
                            "${DOCKER_REPO}/rtrwnet-homepage:${IMAGE_TAG}",
                            "--build-arg VITE_API_BASE_URL=${env.API_URL} ./Frontend/HomePage"
                        )
                    }
                }
            }
        }

        stage('Push Images') {
            steps {
                script {
                    docker.withRegistry("https://index.docker.io/v1/", DOCKER_CREDENTIALS) {

                        if (params.DEPLOY_BACKEND) {
                            backendImage.push()
                            backendImage.push("latest")
                        }

                        if (params.DEPLOY_USER_DASHBOARD) {
                            userDashboardImage.push()
                            userDashboardImage.push("latest")
                        }

                        if (params.DEPLOY_ADMIN_DASHBOARD) {
                            adminDashboardImage.push()
                            adminDashboardImage.push("latest")
                        }

                        if (params.DEPLOY_HOMEPAGE) {
                            homepageImage.push()
                            homepageImage.push("latest")
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS, variable: 'KUBECONFIG')]) {

                    script {

                        sh """
                        kubectl apply -f ${env.K8S_DIR}/namespace.yaml
                        kubectl apply -f ${env.K8S_DIR}/configmap.yaml
                        kubectl apply -f ${env.K8S_DIR}/secrets.yaml
                        """

                        sh """
                        kubectl apply -f ${env.K8S_DIR}/postgres.yaml
                        kubectl apply -f ${env.K8S_DIR}/redis.yaml
                        """

                        if (params.DEPLOY_BACKEND) {
                            sh """
                            sed 's|\\\${DOCKER_REPO}|${DOCKER_REPO}|g; s|\\\${IMAGE_TAG}|${IMAGE_TAG}|g' \
                            ${env.K8S_DIR}/backend.yaml | kubectl apply -f -
                            """
                        }

                        if (params.DEPLOY_USER_DASHBOARD) {
                            sh """
                            sed 's|\\\${DOCKER_REPO}|${DOCKER_REPO}|g; s|\\\${IMAGE_TAG}|${IMAGE_TAG}|g' \
                            ${env.K8S_DIR}/frontend-user.yaml | kubectl apply -f -
                            """
                        }

                        if (params.DEPLOY_ADMIN_DASHBOARD) {
                            sh """
                            sed 's|\\\${DOCKER_REPO}|${DOCKER_REPO}|g; s|\\\${IMAGE_TAG}|${IMAGE_TAG}|g' \
                            ${env.K8S_DIR}/frontend-admin.yaml | kubectl apply -f -
                            """
                        }

                        if (params.DEPLOY_HOMEPAGE) {
                            sh """
                            sed 's|\\\${DOCKER_REPO}|${DOCKER_REPO}|g; s|\\\${IMAGE_TAG}|${IMAGE_TAG}|g' \
                            ${env.K8S_DIR}/frontend-homepage.yaml | kubectl apply -f -
                            """
                        }

                        sh "kubectl apply -f ${env.K8S_DIR}/ingress.yaml"
                    }
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS, variable: 'KUBECONFIG')]) {

                    sh """
                    kubectl rollout status deployment/backend -n ${env.NAMESPACE} --timeout=300s || true
                    kubectl rollout status deployment/frontend-user -n ${env.NAMESPACE} --timeout=300s || true
                    kubectl rollout status deployment/frontend-admin -n ${env.NAMESPACE} --timeout=300s || true
                    kubectl rollout status deployment/frontend-homepage -n ${env.NAMESPACE} --timeout=300s || true

                    kubectl get pods -n ${env.NAMESPACE}
                    kubectl get svc -n ${env.NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "DEPLOY SUCCESS (${params.ENVIRONMENT})"
        }

        failure {
            echo "DEPLOY FAILED (${params.ENVIRONMENT})"
        }

        always {
            sh "docker image prune -f || true"
        }
    }
}
