-- Add file edit commands
INSERT INTO commands (list_id, command_text, description, is_dangerous, requires_confirmation, is_file_edit, created_by) VALUES
(1, 'nano /etc/network/interfaces', 'Edit network configuration', TRUE, TRUE, TRUE, 1),
(1, 'nano /etc/hosts', 'Edit hosts file', FALSE, FALSE, TRUE, 1),
(1, 'nano /etc/resolv.conf', 'Edit DNS configuration', FALSE, FALSE, TRUE, 1),
(2, 'nano /etc/nginx/nginx.conf', 'Edit Nginx configuration', TRUE, TRUE, TRUE, 1),
(2, 'nano /etc/apache2/apache2.conf', 'Edit Apache configuration', TRUE, TRUE, TRUE, 1),
(3, 'nano /etc/monit/monitrc', 'Edit Monit configuration', TRUE, TRUE, TRUE, 1),
(3, 'nano /etc/logrotate.conf', 'Edit log rotation configuration', FALSE, FALSE, TRUE, 1),
(4, 'nano /etc/ssh/sshd_config', 'Edit SSH server configuration', TRUE, TRUE, TRUE, 1),
(4, 'nano /etc/fail2ban/jail.local', 'Edit Fail2ban configuration', TRUE, TRUE, TRUE, 1),
(5, 'nano /etc/sysctl.conf', 'Edit system parameters', TRUE, TRUE, TRUE, 1); 