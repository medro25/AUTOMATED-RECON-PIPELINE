# AUTOMATED RECONNAISSANCE PIPELINE

A containerized cybersecurity reconnaissance tool that automates subdomain discovery, HTTP probing, port scanning, and vulnerability detection.

---

## PREREQUISITES

- **Docker Desktop** (v20.10+)
- **Docker Compose** (v2.0+)
- **4GB RAM** minimum
- **10GB free disk space**

**Verify installation:**

```bash
docker --version
docker-compose --version
```

---

## INSTALLATION & SETUP

### 1. Clone Repository

```bash
git clone https://github.com/medro25/AUTOMATED-RECON-PIPELINE.git
cd AUTOMATED-RECON-PIPELINE
```

### 2. Build and Start Services

```bash
docker-compose up --build
```

**Or run in background:**

```bash
docker-compose up -d --build
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

---

## USAGE

1. Open http://localhost:3000
2. Enter target domain (e.g., `example.com`)
3. Click "Initiate Scan"
4. Wait for results (10-20 minutes)

**WARNING**: Only scan domains you own or have written permission to test.

---

## STOPPING THE APPLICATION

```bash
# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove everything (including volumes)
docker-compose down -v
```

---

## TROUBLESHOOTING

### Containers won't start

```bash
docker-compose down -v
docker-compose up --build --force-recreate
```

### Port already in use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### View logs

```bash
docker logs -f recon-backend
docker logs -f recon-frontend
```

---

## PROJECT STRUCTURE

```
AUTOMATED-RECON-PIPELINE/
├── backend/              # Node.js backend with security tools
├── frontend/             # React frontend
├── docker-compose.yml    # Container orchestration
└── README.md            # This file
```

---

## TOOLS USED

- **Subfinder**: Subdomain enumeration
- **HTTPx**: HTTP service detection
- **Naabu**: Port scanning
- **Nuclei**: Vulnerability scanning (11,000+ templates)

---

## LICENSE

MIT License

---

## AUTHOR

**Errafay Amine Errafay**

- GitHub: [@medro25](https://github.com/medro25)
- Repository: [AUTOMATED-RECON-PIPELINE](https://github.com/medro25/AUTOMATED-RECON-PIPELINE)
