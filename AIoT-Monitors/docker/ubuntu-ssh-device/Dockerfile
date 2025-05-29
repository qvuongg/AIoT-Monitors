FROM ubuntu:22.04

# Định nghĩa build arguments
ARG SSH_USER=admin
ARG SSH_PASSWORD=admin

# Cài đặt SSH server và các công cụ cần thiết
RUN apt-get update && apt-get install -y \
    openssh-server \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục cho SSH
RUN mkdir /var/run/sshd

# Cấu hình SSH
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# Tạo user và cấu hình SSH
RUN useradd -m -s /bin/bash ${SSH_USER} \
    && echo "${SSH_USER}:${SSH_PASSWORD}" | chpasswd \
    && echo "${SSH_USER} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${SSH_USER}

# Mở cổng SSH
EXPOSE 22

# Khởi động SSH server
CMD ["/usr/sbin/sshd", "-D"] 