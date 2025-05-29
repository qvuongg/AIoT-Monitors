#!/bin/bash

# Function to create user in container
create_user() {
    local container_name=$1
    local username=$2
    local password=$3

    echo "Creating user $username in container $container_name..."
    docker exec $container_name bash -c "useradd -m -s /bin/bash $username && echo '$username:$password' | chpasswd"
}

# Create users for each container
create_user "aiot-core-router-01" "admin" "secure_router_pwd123"
create_user "aiot-my-docker-device-1" "operator" "operator_password"
create_user "aiot-dist-switch-01" "netadmin" "sw1tch_adm1n_pwd"
create_user "aiot-webserver-prod-01" "webadmin" "WebServer#123"
create_user "aiot-db-server-prod-01" "dbadmin" "DBServer@456"
create_user "aiot-edge-gateway-01" "edgeadmin" "3dge_Dev1ce!"
create_user "aiot-edge-processor-01" "aiuser" "ML_Pr0c3ss1ng"
create_user "aiot-firewall-external-01" "secadmin" "F1r3w@ll_Adm1n"
create_user "aiot-ids-system-01" "idsadmin" "1nTru$10n_D3t3ct"
create_user "aiot-dev-test-server-01" "devtester" "DevTest@2025"

echo "All users have been created successfully!" 