fn main() {
    println!("=======================================================================");
    println!("[NEXUS-RUNNER] ⚠️  THIS RUNNER IS DEPRECATED");
    println!("=======================================================================");
    println!("Reason: The application has transitioned to hosted cloud infrastructure");
    println!("        using Supabase, removing the requirement for local Docker-based");
    println!("        PostgreSQL, Redis, and MinIO storage layers.");
    println!("");
    println!("Recommended Action:");
    println!("  Please run the development server directly from the project root:");
    println!("  > npm run dev");
    println!("=======================================================================");
    std::process::exit(0);
}
