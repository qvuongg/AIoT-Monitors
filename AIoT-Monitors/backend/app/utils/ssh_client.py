import paramiko
import os
import time
from io import StringIO

class SSHClient:
    def __init__(self, hostname, port=22, username=None, password=None, key_file=None, authentication_method='key'):
        self.hostname = hostname
        self.port = port
        self.username = username
        self.password = password
        self.key_file = key_file
        self.authentication_method = authentication_method
        self.client = None
    
    def connect(self):
        """Establish an SSH connection to the device"""
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Nếu authentication_method là password, ưu tiên sử dụng password
            if self.authentication_method == 'password' and self.password:
                print(f"Using password authentication for {self.hostname}:{self.port}")
                self.client.connect(
                    hostname=self.hostname,
                    port=self.port,
                    username=self.username,
                    password=self.password
                )
                return True
            
            # Nếu không, thử các phương thức xác thực khác
            if self.authentication_method == 'key' or (self.key_file and os.path.exists(self.key_file)):
                if self.key_file and os.path.exists(self.key_file):
                    key = paramiko.RSAKey.from_private_key_file(self.key_file)
                    self.client.connect(
                        hostname=self.hostname,
                        port=self.port,
                        username=self.username,
                        pkey=key
                    )
                else:
                    # Sử dụng key mặc định từ ~/.ssh/id_rsa
                    try:
                        default_key_file = os.path.expanduser('~/.ssh/id_rsa')
                        if os.path.exists(default_key_file):
                            key = paramiko.RSAKey.from_private_key_file(default_key_file)
                            self.client.connect(
                                hostname=self.hostname,
                                port=self.port,
                                username=self.username,
                                pkey=key
                            )
                        else:
                            # Nếu không tìm thấy file key, sử dụng tự động
                            self.client.connect(
                                hostname=self.hostname,
                                port=self.port,
                                username=self.username,
                                look_for_keys=True,
                                allow_agent=True
                            )
                    except Exception as e:
                        # Thử kết nối mà không cần xác thực (thường không hoạt động, nhưng thử)
                        print(f"SSH key authentication failed: {str(e)}, trying without authentication")
                        self.client.connect(
                            hostname=self.hostname,
                            port=self.port,
                            username=self.username
                        )
            else:
                # Sử dụng mật khẩu nếu được cung cấp
                if self.password:
                    self.client.connect(
                        hostname=self.hostname,
                        port=self.port,
                        username=self.username,
                        password=self.password
                    )
                else:
                    # Không có mật khẩu, thử kết nối bằng key
                    self.client.connect(
                        hostname=self.hostname,
                        port=self.port,
                        username=self.username,
                        look_for_keys=True,
                        allow_agent=True
                    )
            
            return True
        except Exception as e:
            print(f"SSH connection error: {str(e)}")
            raise
    
    def execute_command(self, command):
        """Execute a command on the device"""
        if not self.client:
            raise Exception("Not connected. Call connect() first.")
        
        # Execute the command
        stdin, stdout, stderr = self.client.exec_command(command)
        
        # Get command output
        output_stdout = stdout.read().decode('utf-8')
        output_stderr = stderr.read().decode('utf-8')
        
        # Get the exit code
        exit_code = stdout.channel.recv_exit_status()
        
        # Combine stdout and stderr
        output = output_stdout
        if output_stderr:
            output += "\n--- STDERR ---\n" + output_stderr
        
        return exit_code, output
    
    def edit_file(self, file_path, content):
        """Edit a file on the device"""
        if not self.client:
            raise Exception("Not connected. Call connect() first.")
        
        # Create a temporary file with the new content
        temp_file = f"/tmp/temp_edit_{int(time.time())}"
        
        try:
            # Create SFTP session
            sftp = self.client.open_sftp()
            
            # Write content to temporary file
            with sftp.file(temp_file, 'w') as f:
                f.write(content)
            
            # Move temporary file to the destination
            _, output = self.execute_command(f"mv {temp_file} {file_path}")
            
            # Return success
            return 0, f"File {file_path} updated successfully"
            
        except Exception as e:
            return 1, str(e)
        finally:
            # Clean up temporary file if it still exists
            try:
                self.execute_command(f"rm -f {temp_file}")
            except:
                pass
    
    def read_file(self, file_path):
        """Read a file from the device"""
        if not self.client:
            raise Exception("Not connected. Call connect() first.")
        
        try:
            # Create SFTP session
            sftp = self.client.open_sftp()
            
            # Read the file
            with sftp.file(file_path, 'r') as f:
                content = f.read().decode('utf-8')
            
            return 0, content
            
        except Exception as e:
            return 1, str(e)
    
    def close(self):
        """Close the SSH connection"""
        if self.client:
            self.client.close()
            self.client = None 