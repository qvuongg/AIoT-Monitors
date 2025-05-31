import paramiko
import os
import time
from io import StringIO

class SSHClient:
    def __init__(self, hostname, port, username, password, authentication_method='password'):
        self.hostname = hostname
        self.port = port
        self.username = username
        self.password = password
        self.authentication_method = authentication_method
        self.client = None
        self.sftp = None
    
    def connect(self):
        """Establish SSH connection"""
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(
                hostname=self.hostname,
                port=self.port,
                username=self.username,
                password=self.password
            )
            self.sftp = self.client.open_sftp()
        except Exception as e:
            raise Exception(f"Failed to connect: {str(e)}")
    
    def execute_command(self, command):
        """Execute a command on the remote server"""
        if not self.client:
            raise Exception("Not connected")
        
        try:
            stdin, stdout, stderr = self.client.exec_command(command)
            exit_code = stdout.channel.recv_exit_status()
            output = stdout.read().decode()
            error = stderr.read().decode()
            
            # Combine output and error if there's an error
            if error:
                output = f"{output}\n{error}"
            
            return exit_code, output
        except Exception as e:
            raise Exception(f"Command execution failed: {str(e)}")
    
    def read_file(self, file_path):
        """Read content of a file"""
        if not self.sftp:
            raise Exception("Not connected")
        
        try:
            with self.sftp.open(file_path, 'r') as f:
                content = f.read()
            return content
        except Exception as e:
            raise Exception(f"Failed to read file: {str(e)}")
    
    def edit_file(self, file_path, content, edit_type='modify'):
        """Edit a file on the remote server"""
        if not self.sftp:
            raise Exception("Not connected")
        
        try:
            if edit_type == 'create':
                # Create new file
                with self.sftp.open(file_path, 'w') as f:
                    f.write(content)
            elif edit_type == 'modify':
                # Modify existing file
                with self.sftp.open(file_path, 'w') as f:
                    f.write(content)
            elif edit_type == 'delete':
                # Delete file
                self.sftp.remove(file_path)
            else:
                raise Exception(f"Invalid edit type: {edit_type}")
            
            return True
        except Exception as e:
            raise Exception(f"Failed to edit file: {str(e)}")
    
    def close(self):
        """Close SSH connection"""
        if self.sftp:
            self.sftp.close()
        if self.client:
            self.client.close() 