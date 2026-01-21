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
        booleanParam(name: 'DEPLOY_FREERADIUS', defaultValue: true, description: 'Deploy FreeRADIUS')
        booleanParam(name: 'DEPLOY_OPENVPN', defaultValue: true, description: 'Deploy OpenVPN (auto-init PKI)')
        booleanParam(name: 'DEPLOY_MONITORING', defaultValue: false, description: 'Deploy Monitoring (Prometheus + Grafana)')
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
                        env.K8S_DIR = 'k8s/overlays/production'
                    } else {
                        env.NAMESPACE = 'rtrwnet-staging'
                        env.API_URL = 'https://api-staging.fureup.my.id/api/v1'
                        env.K8S_DIR = 'k8s/overlays/staging'
                    }
                }
            }
        }

        stage('Build Images') {
            steps {
                script {
                    def backendImage
                    def userDashboardImage
                    def adminDashboardImage
                    def homepageImage
                    def freeradiusImage
                    def openvpnImage

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

                    if (params.DEPLOY_FREERADIUS) {
                        freeradiusImage = docker.build(
                            "${DOCKER_REPO}/rtrwnet-freeradius:${IMAGE_TAG}",
                            "-f ./Backend/freeradius/Dockerfile ./Backend"
                        )
                    }

                    if (params.DEPLOY_OPENVPN) {
                        openvpnImage = docker.build(
                            "${DOCKER_REPO}/rtrwnet-openvpn:${IMAGE_TAG}",
                            "-f ./Backend/openvpn/Dockerfile ./Backend"
                        )
                    }

                    // Store in env for next stage
                    env.BACKEND_IMAGE = backendImage?.imageName()
                    env.USER_DASHBOARD_IMAGE = userDashboardImage?.imageName()
                    env.ADMIN_DASHBOARD_IMAGE = adminDashboardImage?.imageName()
                    env.HOMEPAGE_IMAGE = homepageImage?.imageName()
                    env.FREERADIUS_IMAGE = freeradiusImage?.imageName()
                    env.OPENVPN_IMAGE = openvpnImage?.imageName()
                }
            }
        }

        stage('Push Images') {
            steps {
                script {
                    docker.withRegistry("https://index.docker.io/v1/", DOCKER_CREDENTIALS) {

                        if (params.DEPLOY_BACKEND) {
                            def img = docker.image("${DOCKER_REPO}/rtrwnet-backend:${IMAGE_TAG}")
                            img.push()
                            img.push("latest")
                        }

                        if (params.DEPLOY_USER_DASHBOARD) {
                            def img = docker.image("${DOCKER_REPO}/rtrwnet-user-dashboard:${IMAGE_TAG}")
                            img.push()
                            img.push("latest")
                        }

                        if (params.DEPLOY_ADMIN_DASHBOARD) {
                            def img = docker.image("${DOCKER_REPO}/rtrwnet-admin-dashboard:${IMAGE_TAG}")
                            img.push()
                            img.push("latest")
                        }

                        if (params.DEPLOY_HOMEPAGE) {
                            def img = docker.image("${DOCKER_REPO}/rtrwnet-homepage:${IMAGE_TAG}")
                            img.push()
                            img.push("latest")
                        }

                        if (params.DEPLOY_FREERADIUS) {
                            def img = docker.image("${DOCKER_REPO}/rtrwnet-freeradius:${IMAGE_TAG}")
                            img.push()
                            img.push("latest")
                        }

                        if (params.DEPLOY_OPENVPN) {
                            def img = docker.image("${DOCKER_REPO}/rtrwnet-openvpn:${IMAGE_TAG}")
                            img.push()
                            img.push("latest")
                        }
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: KUBECONFIG_CREDENTIALS, variable: 'KUBECONFIG')]) {

                    script {
                        // Deploy Monitoring jika dipilih
                        if (params.DEPLOY_MONITORING) {
                            sh "kubectl apply -k k8s/base/monitoring"
                        }

                        // Hitung checksum configmap dan secrets untuk auto-restart jika berubah
                        def configChecksum = sh(
                            script: "cat ${env.K8S_DIR}/configmap.yaml ${env.K8S_DIR}/secrets.yaml | sha256sum | cut -d' ' -f1",
                            returnStdout: true
                        ).trim()

                        // Deploy menggunakan Kustomize dengan image override dan config checksum
                        sh """
                        kubectl kustomize ${env.K8S_DIR} \\
                            --load-restrictor LoadRestrictionsNone | \\
                        sed 's|rtrwnet-backend:latest|${DOCKER_REPO}/rtrwnet-backend:${IMAGE_TAG}|g' | \\
                        sed 's|rtrwnet-admin-dashboard:latest|${DOCKER_REPO}/rtrwnet-admin-dashboard:${IMAGE_TAG}|g' | \\
                        sed 's|rtrwnet-user-dashboard:latest|${DOCKER_REPO}/rtrwnet-user-dashboard:${IMAGE_TAG}|g' | \\
                        sed 's|rtrwnet-homepage:latest|${DOCKER_REPO}/rtrwnet-homepage:${IMAGE_TAG}|g' | \\
                        kubectl apply -f -
                        """

                        // Patch backend deployment dengan config checksum (auto-restart jika config berubah)
                        sh """
                        kubectl patch deployment backend -n ${env.NAMESPACE} -p '{"spec":{"template":{"metadata":{"annotations":{"config-checksum":"${configChecksum}"}}}}}'
                        """

                        // Rollout restart hanya untuk komponen yang dipilih
                        if (params.DEPLOY_BACKEND) {
                            sh "kubectl rollout restart deployment/backend -n ${env.NAMESPACE}"
                        }
                        if (params.DEPLOY_USER_DASHBOARD) {
                            sh "kubectl rollout restart deployment/frontend-user -n ${env.NAMESPACE}"
                        }
                        if (params.DEPLOY_ADMIN_DASHBOARD) {
                            sh "kubectl rollout restart deployment/frontend-admin -n ${env.NAMESPACE}"
                        }
                        if (params.DEPLOY_HOMEPAGE) {
                            sh "kubectl rollout restart deployment/frontend-homepage -n ${env.NAMESPACE}"
                        }
                        if (params.DEPLOY_FREERADIUS) {
                            sh "kubectl rollout restart deployment/freeradius -n ${env.NAMESPACE}"
                        }
                        if (params.DEPLOY_OPENVPN) {
                            sh "kubectl rollout restart deployment/openvpn -n ${env.NAMESPACE}"
                        }
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
                    kubectl rollout status deployment/freeradius -n ${env.NAMESPACE} --timeout=300s || true
                    kubectl rollout status deployment/openvpn -n ${env.NAMESPACE} --timeout=300s || true

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
