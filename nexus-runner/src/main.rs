use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

fn kill_process_tree(pid: u32) {
    let _ = Command::new("taskkill")
        .args(&["/F", "/T", "/PID", &pid.to_string()])
        .output();
}

fn is_docker_ready() -> bool {
    let output = Command::new("docker")
        .arg("info")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status();
    
    match output {
        Ok(status) => status.success(),
        Err(_) => false,
    }
}

fn start_docker_desktop() {
    println!("[RUNNER] Docker is not running. Attempting to start Docker Desktop...");
    let _ = Command::new("cmd")
        .args(&["/C", "start", "", "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"])
        .spawn();
}

fn wait_for_docker(timeout_secs: u64) -> bool {
    if is_docker_ready() {
        println!("[RUNNER] Docker is already running and ready.");
        return true;
    }

    start_docker_desktop();

    let start_time = Instant::now();
    let timeout = Duration::from_secs(timeout_secs);

    println!("[RUNNER] Waiting for Docker daemon to be ready (timeout: {}s)...", timeout_secs);
    
    while start_time.elapsed() < timeout {
        if is_docker_ready() {
            println!("[RUNNER] Docker is now ready.");
            return true;
        }
        thread::sleep(Duration::from_secs(2));
    }

    false
}

fn run_docker_compose() -> bool {
    println!("[RUNNER] Orchestrating infrastructure via docker-compose...");
    let status = Command::new("docker-compose")
        .args(&["up", "-d"])
        .current_dir("..") // Run from project root
        .status();

    match status {
        Ok(s) => s.success(),
        Err(_) => false,
    }
}

fn main() {
    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();

    ctrlc::set_handler(move || {
        println!("\n[RUNNER] Received Ctrl-C, shutting down services...");
        r.store(false, Ordering::SeqCst);
    }).expect("Error setting Ctrl-C handler");

    // 1. Ensure Docker is ready
    if !wait_for_docker(60) {
        eprintln!("[RUNNER:ERROR] Docker failed to start or becomes ready within 60s. Please ensure Docker Desktop is installed and start it manually.");
        return;
    }

    // 2. Orchestrate Infrastructure
    if !run_docker_compose() {
        eprintln!("[RUNNER:ERROR] Failed to start infrastructure via docker-compose. Check your docker-compose.yml file.");
        return;
    }

    println!("[RUNNER] Starting Nexus Full-Stack Next.js Services...");
    let mut frontend_child = Command::new("cmd")
        .args(&["/c", "npm", "run", "dev"])
        .current_dir("../") // From nexus-runner/ back to palantir/
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start full-stack server");

    let frontend_pid = frontend_child.id();

    let frontend_out = frontend_child.stdout.take().unwrap();
    let frontend_err = frontend_child.stderr.take().unwrap();

    thread::spawn(move || {
        let reader = BufReader::new(frontend_out);
        for line in reader.lines() {
            if let Ok(l) = line {
                println!("[SERVER] {}", l);
            }
        }
    });

    thread::spawn(move || {
        let reader = BufReader::new(frontend_err);
        for line in reader.lines() {
            if let Ok(l) = line {
                eprintln!("[SERVER:ERR] {}", l);
            }
        }
    });

    while running.load(Ordering::SeqCst) {
        thread::sleep(std::time::Duration::from_millis(500));
        
        // Check if full-stack process died unexpectedly
        if let Ok(Some(status)) = frontend_child.try_wait() {
            println!("[RUNNER] Next.js server exited with status: {}", status);
            running.store(false, Ordering::SeqCst);
            break;
        }
    }

    println!("[RUNNER] Terminating child process tree...");
    kill_process_tree(frontend_pid);
    
    // Note: We leave docker containers running for persistent DB state
    let _ = frontend_child.wait();

    println!("[RUNNER] Shutdown complete.");
}

