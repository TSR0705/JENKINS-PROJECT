pipeline {
    agent any
    
    environment {
        PLATFORM_IMAGE = 'openci-platform'
        RUNNER_IMAGE = 'openci-runner-image'
        PLATFORM_CONTAINER = 'openci-platform'
        PLATFORM_PORT = '3000'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Run Platform Tests') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Build Runner Image') {
            steps {
                script {
                    sh 'docker build -t ${RUNNER_IMAGE}:latest -f src/docker/Dockerfile.runner .'
                }
            }
        }
        
        stage('Build Platform Image') {
            steps {
                script {
                    sh 'docker build -t ${PLATFORM_IMAGE}:latest .'
                }
            }
        }
        
        stage('Stop Old Platform') {
            steps {
                script {
                    sh '''
                        docker stop ${PLATFORM_CONTAINER} 2>/dev/null || true
                        docker rm ${PLATFORM_CONTAINER} 2>/dev/null || true
                    '''
                }
            }
        }
        
        stage('Deploy Platform') {
            steps {
                script {
                    sh '''
                        docker run -d \
                          --name ${PLATFORM_CONTAINER} \
                          --restart unless-stopped \
                          -p ${PLATFORM_PORT}:3000 \
                          -v /var/run/docker.sock:/var/run/docker.sock \
                          -v $(pwd)/logs:/app/logs \
                          ${PLATFORM_IMAGE}:latest
                    '''
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    sh '''
                        sleep 5
                        curl -f http://localhost:${PLATFORM_PORT}/health || exit 1
                    '''
                }
            }
        }
        
        stage('Cleanup Old Images') {
            steps {
                script {
                    sh '''
                        docker image prune -f --filter "dangling=true"
                    '''
                }
            }
        }
    }
    
    post {
        failure {
            script {
                sh '''
                    echo "Deployment failed. Rolling back..."
                    docker logs ${PLATFORM_CONTAINER} || true
                '''
            }
        }
        always {
            script {
                sh 'docker ps -a | grep openci || true'
            }
        }
    }
}\n
