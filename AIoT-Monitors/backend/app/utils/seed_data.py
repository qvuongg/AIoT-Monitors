from app import create_app, db
from app.models.user import User, UserRole
from app.models.device import Device, DeviceGroup
from app.models.command import Command, CommandList
from app.models.profile import Profile
from app.models.session import Session, CommandLog, SessionStatus
from datetime import datetime, timedelta

def seed_database():
    """Seed the database with sample data"""
    print("Seeding database...")
    
    # Create admin user
    admin = User.query.filter_by(role=UserRole.ADMIN).first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@aiotmonitors.com",
            password="admin123",
            role=UserRole.ADMIN
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created")
    
    # Create team lead
    team_lead = User.query.filter_by(username="teamlead").first()
    if not team_lead:
        team_lead = User(
            username="teamlead",
            email="teamlead@aiotmonitors.com",
            password="password123",
            role=UserRole.TEAM_LEAD
        )
        db.session.add(team_lead)
    
    # Create supervisor
    supervisor = User.query.filter_by(username="supervisor").first()
    if not supervisor:
        supervisor = User(
            username="supervisor",
            email="supervisor@aiotmonitors.com",
            password="password123",
            role=UserRole.SUPERVISOR
        )
        db.session.add(supervisor)
    
    # Create operators
    operators = []
    for i in range(1, 4):
        operator = User.query.filter_by(username=f"operator{i}").first()
        if not operator:
            operator = User(
                username=f"operator{i}",
                email=f"operator{i}@aiotmonitors.com",
                password="password123",
                role=UserRole.OPERATOR
            )
            db.session.add(operator)
            operators.append(operator)
    
    db.session.commit()
    print("Users created")
    
    # Create device groups
    factory_group = DeviceGroup.query.filter_by(name="Factory Devices").first()
    if not factory_group:
        factory_group = DeviceGroup(
            name="Factory Devices",
            description="All IoT devices deployed in factories",
            created_by_id=team_lead.id
        )
        db.session.add(factory_group)
    
    home_group = DeviceGroup.query.filter_by(name="Smart Home Devices").first()
    if not home_group:
        home_group = DeviceGroup(
            name="Smart Home Devices",
            description="All IoT devices deployed in smart homes",
            created_by_id=team_lead.id
        )
        db.session.add(home_group)
    
    db.session.commit()
    print("Device groups created")
    
    # Create devices
    devices = []
    factory_devices = [
        {
            "name": "Factory Hub 1",
            "hostname": "factory-hub-1",
            "ip_address": "192.168.1.101",
            "device_type": "hub",
            "username": "admin",
            "password": "factory123"
        },
        {
            "name": "Factory Router 1",
            "hostname": "factory-router-1",
            "ip_address": "192.168.1.102",
            "device_type": "router",
            "username": "admin",
            "password": "factory123"
        },
        {
            "name": "Factory Switch 1",
            "hostname": "factory-switch-1",
            "ip_address": "192.168.1.103",
            "device_type": "switch",
            "username": "admin",
            "password": "factory123"
        }
    ]
    
    home_devices = [
        {
            "name": "Home Hub 1",
            "hostname": "home-hub-1",
            "ip_address": "192.168.10.101",
            "device_type": "hub",
            "username": "admin",
            "password": "home123"
        },
        {
            "name": "Home Router 1",
            "hostname": "home-router-1",
            "ip_address": "192.168.10.102",
            "device_type": "router",
            "username": "admin",
            "password": "home123"
        }
    ]
    
    for device_data in factory_devices:
        device = Device.query.filter_by(name=device_data["name"]).first()
        if not device:
            device = Device(
                name=device_data["name"],
                hostname=device_data["hostname"],
                ip_address=device_data["ip_address"],
                device_type=device_data["device_type"],
                username=device_data["username"],
                password=device_data["password"],
                created_by_id=team_lead.id
            )
            db.session.add(device)
            devices.append(device)
            factory_group.devices.append(device)
    
    for device_data in home_devices:
        device = Device.query.filter_by(name=device_data["name"]).first()
        if not device:
            device = Device(
                name=device_data["name"],
                hostname=device_data["hostname"],
                ip_address=device_data["ip_address"],
                device_type=device_data["device_type"],
                username=device_data["username"],
                password=device_data["password"],
                created_by_id=team_lead.id
            )
            db.session.add(device)
            devices.append(device)
            home_group.devices.append(device)
    
    db.session.commit()
    print("Devices created")
    
    # Create command lists
    network_commands = CommandList.query.filter_by(name="Network Commands").first()
    if not network_commands:
        network_commands = CommandList(
            name="Network Commands",
            description="Common network commands for troubleshooting",
            created_by_id=team_lead.id
        )
        db.session.add(network_commands)
    
    system_commands = CommandList.query.filter_by(name="System Commands").first()
    if not system_commands:
        system_commands = CommandList(
            name="System Commands",
            description="Common system commands for monitoring and management",
            created_by_id=team_lead.id
        )
        db.session.add(system_commands)
    
    db.session.commit()
    print("Command lists created")
    
    # Create commands
    network_cmd_list = [
        {
            "name": "Ping",
            "command": "ping -c 4 8.8.8.8",
            "description": "Check network connectivity to Google DNS"
        },
        {
            "name": "Network Interfaces",
            "command": "ifconfig",
            "description": "Display network interfaces and their configurations"
        },
        {
            "name": "Route Table",
            "command": "route -n",
            "description": "Display routing table"
        },
        {
            "name": "DNS Resolution",
            "command": "nslookup google.com",
            "description": "Test DNS resolution"
        }
    ]
    
    system_cmd_list = [
        {
            "name": "System Status",
            "command": "systemctl status",
            "description": "Check system services status"
        },
        {
            "name": "Memory Usage",
            "command": "free -m",
            "description": "Display memory usage"
        },
        {
            "name": "Disk Space",
            "command": "df -h",
            "description": "Show disk space usage"
        },
        {
            "name": "Process List",
            "command": "ps aux",
            "description": "List all running processes"
        },
        {
            "name": "Edit Config",
            "command": "nano /etc/config/sample.conf",
            "description": "Edit configuration file",
            "is_file_edit": True
        }
    ]
    
    for cmd_data in network_cmd_list:
        cmd = Command.query.filter_by(name=cmd_data["name"]).first()
        if not cmd:
            cmd = Command(
                name=cmd_data["name"],
                command=cmd_data["command"],
                description=cmd_data["description"],
                is_file_edit=cmd_data.get("is_file_edit", False),
                created_by_id=team_lead.id
            )
            db.session.add(cmd)
            network_commands.commands.append(cmd)
    
    for cmd_data in system_cmd_list:
        cmd = Command.query.filter_by(name=cmd_data["name"]).first()
        if not cmd:
            cmd = Command(
                name=cmd_data["name"],
                command=cmd_data["command"],
                description=cmd_data["description"],
                is_file_edit=cmd_data.get("is_file_edit", False),
                created_by_id=team_lead.id
            )
            db.session.add(cmd)
            system_commands.commands.append(cmd)
    
    db.session.commit()
    print("Commands created")
    
    # Create profiles
    factory_profile = Profile.query.filter_by(name="Factory Network Profile").first()
    if not factory_profile:
        factory_profile = Profile(
            name="Factory Network Profile",
            device_group_id=factory_group.id,
            command_list_id=network_commands.id,
            description="Network commands for factory devices",
            created_by_id=team_lead.id
        )
        db.session.add(factory_profile)
    
    home_profile = Profile.query.filter_by(name="Home System Profile").first()
    if not home_profile:
        home_profile = Profile(
            name="Home System Profile",
            device_group_id=home_group.id,
            command_list_id=system_commands.id,
            description="System commands for home devices",
            created_by_id=team_lead.id
        )
        db.session.add(home_profile)
    
    db.session.commit()
    print("Profiles created")
    
    # Assign profiles to operators
    if operators:
        operators[0].profiles.append(factory_profile)
        operators[0].profiles.append(home_profile)
        operators[1].profiles.append(factory_profile)
        operators[2].profiles.append(home_profile)
    
    db.session.commit()
    print("Profiles assigned to operators")
    
    # Create sessions
    if devices and operators:
        # Active session for operator1 on Factory Hub 1
        active_session1 = Session.query.filter_by(
            user_id=operators[0].id,
            device_id=devices[0].id,
            status=SessionStatus.ACTIVE
        ).first()
        
        if not active_session1:
            active_session1 = Session(
                user_id=operators[0].id,
                device_id=devices[0].id,
                notes="Checking network connectivity"
            )
            db.session.add(active_session1)
        
        # Active session for operator2 on Factory Router 1
        active_session2 = Session.query.filter_by(
            user_id=operators[1].id,
            device_id=devices[1].id,
            status=SessionStatus.ACTIVE
        ).first()
        
        if not active_session2:
            active_session2 = Session(
                user_id=operators[1].id,
                device_id=devices[1].id,
                notes="Troubleshooting routing issues"
            )
            db.session.add(active_session2)
        
        # Completed session for operator3 on Home Hub 1
        completed_session = Session.query.filter_by(
            user_id=operators[2].id,
            device_id=devices[3].id,
            status=SessionStatus.COMPLETED
        ).first()
        
        if not completed_session:
            completed_session = Session(
                user_id=operators[2].id,
                device_id=devices[3].id,
                notes="Regular system check"
            )
            completed_session.end_session(SessionStatus.COMPLETED)
            completed_session.start_time = datetime.utcnow() - timedelta(hours=2)
            completed_session.end_time = datetime.utcnow() - timedelta(hours=1)
            db.session.add(completed_session)
        
        db.session.commit()
        print("Sessions created")
        
        # Add command logs
        if not CommandLog.query.filter_by(session_id=active_session1.id).first():
            # Commands for active_session1
            ping_cmd = Command.query.filter_by(name="Ping").first()
            ifconfig_cmd = Command.query.filter_by(name="Network Interfaces").first()
            
            ping_log = CommandLog(
                session_id=active_session1.id,
                command_id=ping_cmd.id if ping_cmd else None,
                raw_command="ping -c 4 8.8.8.8",
                output="PING 8.8.8.8 (8.8.8.8): 56 data bytes\n64 bytes from 8.8.8.8: icmp_seq=0 ttl=119 time=13.223 ms\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=119 time=15.498 ms\n64 bytes from 8.8.8.8: icmp_seq=2 ttl=119 time=11.554 ms\n64 bytes from 8.8.8.8: icmp_seq=3 ttl=119 time=12.319 ms\n\n--- 8.8.8.8 ping statistics ---\n4 packets transmitted, 4 packets received, 0.0% packet loss\nround-trip min/avg/max/stddev = 11.554/13.149/15.498/1.438 ms",
                exit_code=0,
                executed_at=datetime.utcnow() - timedelta(minutes=15)
            )
            db.session.add(ping_log)
            
            ifconfig_log = CommandLog(
                session_id=active_session1.id,
                command_id=ifconfig_cmd.id if ifconfig_cmd else None,
                raw_command="ifconfig",
                output="eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.101  netmask 255.255.255.0  broadcast 192.168.1.255\n        inet6 fe80::216:3eff:fe2f:8ad5  prefixlen 64  scopeid 0x20<link>\n        ether 00:16:3e:2f:8a:d5  txqueuelen 1000  (Ethernet)\n        RX packets 14516834  bytes 5031090339 (5.0 GB)\n        RX errors 0  dropped 0  overruns 0  frame 0\n        TX packets 12852489  bytes 2497380007 (2.4 GB)\n        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        inet6 ::1  prefixlen 128  scopeid 0x10<host>\n        loop  txqueuelen 1000  (Local Loopback)\n        RX packets 10307645  bytes 2339451213 (2.3 GB)\n        RX errors 0  dropped 0  overruns 0  frame 0\n        TX packets 10307645  bytes 2339451213 (2.3 GB)\n        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0",
                exit_code=0,
                executed_at=datetime.utcnow() - timedelta(minutes=10)
            )
            db.session.add(ifconfig_log)
            
            # Commands for active_session2
            route_cmd = Command.query.filter_by(name="Route Table").first()
            
            route_log = CommandLog(
                session_id=active_session2.id,
                command_id=route_cmd.id if route_cmd else None,
                raw_command="route -n",
                output="Kernel IP routing table\nDestination     Gateway         Genmask         Flags Metric Ref    Use Iface\n0.0.0.0         192.168.1.1     0.0.0.0         UG    0      0        0 eth0\n192.168.1.0     0.0.0.0         255.255.255.0   U     0      0        0 eth0",
                exit_code=0,
                executed_at=datetime.utcnow() - timedelta(minutes=5)
            )
            db.session.add(route_log)
            
            # Commands for completed_session
            disk_cmd = Command.query.filter_by(name="Disk Space").first()
            memory_cmd = Command.query.filter_by(name="Memory Usage").first()
            
            disk_log = CommandLog(
                session_id=completed_session.id,
                command_id=disk_cmd.id if disk_cmd else None,
                raw_command="df -h",
                output="Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        30G   12G   17G  42% /\ntmpfs           2.0G     0  2.0G   0% /dev/shm",
                exit_code=0,
                executed_at=datetime.utcnow() - timedelta(hours=2)
            )
            db.session.add(disk_log)
            
            memory_log = CommandLog(
                session_id=completed_session.id,
                command_id=memory_cmd.id if memory_cmd else None,
                raw_command="free -m",
                output="              total        used        free      shared  buff/cache   available\nMem:            3951         754        2059          11        1138        2937\nSwap:           2047           0        2047",
                exit_code=0,
                executed_at=datetime.utcnow() - timedelta(hours=1, minutes=30)
            )
            db.session.add(memory_log)
            
            db.session.commit()
            print("Command logs created")
    
    print("Database seeding completed!")

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_database() 