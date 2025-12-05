#!/usr/bin/env python3
"""
Protego Runner Script
Runs both backend and frontend servers for local development without Docker.
"""

import os
import sys
import subprocess
import time
import signal
import shutil
from pathlib import Path

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(msg):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{msg:^60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(msg):
    print(f"{Colors.OKGREEN}✓ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}✗ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.OKCYAN}→ {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.WARNING}⚠ {msg}{Colors.ENDC}")

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.resolve()
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# Process handlers
processes = []

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    print_warning("\n\nShutting down Protego...")
    for process in processes:
        if process.poll() is None:  # If process is still running
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
    print_success("All processes terminated. Goodbye!")
    sys.exit(0)

def check_python_version():
    """Check if Python version is 3.11+."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        print_error(f"Python 3.11+ required. You have Python {version.major}.{version.minor}.{version.micro}")
        return False
    print_success(f"Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def check_node():
    """Check if Node.js is installed."""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True, check=True)
        version = result.stdout.strip()
        print_success(f"Node.js {version} detected")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_error("Node.js not found. Please install Node.js 20+")
        return False

def check_postgresql():
    """Check if PostgreSQL is running."""
    try:
        result = subprocess.run(
            ['pg_isready', '-h', 'localhost', '-p', '5432'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print_success("PostgreSQL is running on port 5432")
            return True
        else:
            print_warning("PostgreSQL not detected on port 5432")
            print_info("You can start PostgreSQL with: sudo systemctl start postgresql")
            return False
    except FileNotFoundError:
        print_warning("pg_isready not found. Make sure PostgreSQL is installed.")
        return False

def setup_backend():
    print_header("Setting Up Backend")

    # Check for existing .venv first (Python 3.12), then fallback to venv
    venv_path = BACKEND_DIR / ".venv"
    if not venv_path.exists():
        venv_path = BACKEND_DIR / "venv"

    # Determine pip path to check if venv is valid
    if os.name == 'nt':
        pip_check_path = venv_path / "Scripts" / "pip.exe"
    else:
        pip_check_path = venv_path / "bin" / "pip"

    # Check if venv exists AND is valid (has pip)
    venv_is_valid = venv_path.exists() and pip_check_path.exists()

    if not venv_is_valid:
        if venv_path.exists():
            print_warning(f"Virtual environment '{venv_path.name}' is corrupted (missing pip)")
            print_info("Removing corrupted virtual environment...")
            shutil.rmtree(venv_path)
        # Create .venv with Python 3.12 if available
        print_info("Creating virtual environment...")
        preferred_python = os.environ.get("PROTEGO_PYTHON") or shutil.which("python3.12") or sys.executable
        venv_path = BACKEND_DIR / ".venv"
        subprocess.run([preferred_python, '-m', 'venv', str(venv_path)], check=True)
        print_success("Virtual environment created")
    else:
        venv_name = venv_path.name
        print_info(f"Virtual environment '{venv_name}' already exists")

    if os.name == 'nt':
        pip_path = venv_path / "Scripts" / "pip"
        python_path = venv_path / "Scripts" / "python"
    else:
        pip_path = venv_path / "bin" / "pip"
        python_path = venv_path / "bin" / "python"

    requirements_file = BACKEND_DIR / "requirements.txt"
    if requirements_file.exists():
        print_info("Installing Python dependencies...")
        install_env = os.environ.copy()
        # Add PostgreSQL bin directory to PATH for pg_config
        pg_paths = [
            "/usr/bin",
            "/usr/pgsql-*/bin",  # Common on Fedora/RHEL
            "/usr/lib/postgresql/*/bin",  # Common on Debian/Ubuntu
        ]
        install_env['PATH'] = f"{':'.join(pg_paths)}:{install_env.get('PATH', '')}"
        try:
            subprocess.run([str(pip_path), 'install', '-r', str(requirements_file)], check=True, env=install_env)
            print_success("Python dependencies installed")
        except subprocess.CalledProcessError:
            print_error("Failed to install dependencies. Trying with system pg_config...")
            # Try to find pg_config
            try:
                pg_config_result = subprocess.run(['which', 'pg_config'], capture_output=True, text=True)
                if pg_config_result.returncode == 0:
                    pg_bin_dir = os.path.dirname(pg_config_result.stdout.strip())
                    install_env['PATH'] = f"{pg_bin_dir}:{install_env.get('PATH', '')}"
                    subprocess.run([str(pip_path), 'install', '-r', str(requirements_file)], check=True, env=install_env)
                    print_success("Python dependencies installed")
                else:
                    raise subprocess.CalledProcessError(1, "pg_config not found")
            except subprocess.CalledProcessError:
                print_error("Failed to install psycopg2-binary. You may need to install postgresql-devel:")
                print_info("  sudo dnf install postgresql-devel  # Fedora/RHEL")
                print_info("  sudo apt install libpq-dev         # Debian/Ubuntu")
                raise

    env_file = BACKEND_DIR / ".env"
    env_example = BACKEND_DIR / ".env.example"

    if not env_file.exists() and env_example.exists():
        print_warning(".env file not found")
        print_info("Copying .env.example to .env")
        shutil.copy(env_example, env_file)
        print_success(".env file created")
        print_warning("Please edit backend/.env with your configuration!")

    return python_path

def setup_frontend():
    """Set up frontend dependencies."""
    print_header("Setting Up Frontend")

    package_json = FRONTEND_DIR / "package.json"
    node_modules = FRONTEND_DIR / "node_modules"

    if not node_modules.exists():
        print_info("Installing Node.js dependencies...")
        subprocess.run(['npm', 'install'], cwd=FRONTEND_DIR, check=True)
        print_success("Node.js dependencies installed")
    else:
        print_info("Node.js dependencies already installed")

def start_backend(python_path):
    """Start the FastAPI backend server."""
    print_header("Starting Backend Server")

    print_info("Starting FastAPI on http://localhost:8000")

    # Set environment variable for the backend
    env = os.environ.copy()
    env['PYTHONPATH'] = str(BACKEND_DIR)

    process = subprocess.Popen(
        [str(python_path), '-m', 'uvicorn', 'main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'],
        cwd=BACKEND_DIR,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    processes.append(process)

    # Wait for backend to start
    print_info("Waiting for backend to start...")
    time.sleep(3)

    if process.poll() is None:
        print_success("Backend server started successfully")
        print_info("API Documentation: http://localhost:8000/docs")
        return True
    else:
        print_error("Backend server failed to start")
        return False

def start_frontend():
    """Start the Vite frontend development server."""
    print_header("Starting Frontend Server")

    print_info("Starting Vite dev server on http://0.0.0.0:5173")

    process = subprocess.Popen(
        ['npm', 'run', 'dev', '--', '--host', '0.0.0.0'],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    processes.append(process)

    # Wait for frontend to start
    print_info("Waiting for frontend to start...")
    time.sleep(3)

    if process.poll() is None:
        print_success("Frontend server started successfully")
        print_info("Application: http://0.0.0.0:5173")
        print_info("Network URL: http://172.31.112.216:5173")
        return True
    else:
        print_error("Frontend server failed to start")
        return False

def stream_output():
    """Stream output from both processes."""
    print_header("Protego is Running!")
    print_success("Frontend: http://localhost:5173")
    print_success("Backend API: http://localhost:8000/docs")
    print_info("Press Ctrl+C to stop all servers\n")
    print(f"{Colors.OKCYAN}{'='*60}{Colors.ENDC}\n")

    try:
        while True:
            for i, process in enumerate(processes):
                if process.poll() is not None:
                    print_error(f"Process {i} has stopped unexpectedly")
                    signal_handler(None, None)

            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)

def main():
    """Main runner function."""
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)

    print_header("Protego Development Server")

    # Pre-flight checks
    print_info("Running pre-flight checks...")

    if not check_python_version():
        sys.exit(1)

    if not check_node():
        sys.exit(1)

    if not check_postgresql():
        print_warning("Continuing without PostgreSQL check...")
        print_info("Make sure PostgreSQL is running and configured in backend/.env")

    # Setup
    try:
        python_path = setup_backend()
        setup_frontend()
    except subprocess.CalledProcessError as e:
        print_error(f"Setup failed: {e}")
        sys.exit(1)

    # Start servers
    backend_started = start_backend(python_path)
    if not backend_started:
        print_error("Failed to start backend. Check backend/.env configuration.")
        sys.exit(1)

    frontend_started = start_frontend()
    if not frontend_started:
        print_error("Failed to start frontend.")
        signal_handler(None, None)
        sys.exit(1)

    # Stream output
    stream_output()

if __name__ == "__main__":
    main()
