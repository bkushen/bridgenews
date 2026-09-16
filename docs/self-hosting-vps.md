# BridgeNews VPS Self-Hosting

BridgeNews can run on a small Ubuntu VPS with Docker while continuing to use Supabase for database, auth, storage and ingestion services.

## Recommended starting server

- Ubuntu 24.04 LTS
- 2 vCPU
- 2-4 GB RAM
- 40+ GB SSD
- Public IPv4 address
- Ports 22, 80 and 443 open

## Architecture

Domain -> Caddy (automatic HTTPS) -> BridgeNews Next.js container -> Supabase

Caddy automatically obtains and renews TLS certificates after the domain points to the VPS.

## 1. Point the domain to the VPS

At the DNS provider create:

- `A` record: `@` -> VPS IPv4
- `A` record: `www` -> VPS IPv4, if using www

If using a subdomain such as `news.example.com`, create an `A` record for `news` instead.

Wait until DNS resolves to the VPS before expecting HTTPS certificate issuance.

## 2. Initial Ubuntu setup

SSH into the server and run:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw
```

Install Docker from Docker's official repository or package source, then verify:

```bash
docker --version
docker compose version
```

Enable the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 3. Install BridgeNews

```bash
sudo mkdir -p /opt/bridgenews
sudo chown "$USER":"$USER" /opt/bridgenews
git clone https://github.com/bkushen/bridgenews.git /opt/bridgenews
cd /opt/bridgenews
git checkout main
```

For a private repository, configure a read-only GitHub deploy key instead of anonymous cloning.

## 4. Add production environment variables

```bash
cd /opt/bridgenews
cp .env.example .env.production
nano .env.production
```

At minimum configure:

```dotenv
SITE_DOMAIN=your-domain.example
NEXT_PUBLIC_SITE_URL=https://your-domain.example
BRIDGENEWS_SITE_URL=https://your-domain.example
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Keep `.env.production` only on the server. Never commit it to GitHub.

## 5. First production start

```bash
cd /opt/bridgenews
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

Inspect containers:

```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs -f --tail=100
```

Once DNS is correct, Caddy will automatically provision HTTPS and BridgeNews should be available at:

```text
https://your-domain.example
```

## 6. Controlled production deployments

The repository contains `deploy/server-deploy.sh`. It updates the server to the latest `main`, rebuilds the web container and restarts the stack.

Run manually on the VPS:

```bash
cd /opt/bridgenews
sh deploy/server-deploy.sh
```

The GitHub Actions workflow `.github/workflows/deploy-vps.yml` is manual-only (`workflow_dispatch`), so commits do not automatically consume server build resources.

Configure these GitHub repository secrets before using the workflow:

- `VPS_HOST` - VPS IP or hostname
- `VPS_USER` - SSH user
- `VPS_PORT` - usually `22`
- `VPS_SSH_KEY` - private SSH key allowed to access the VPS

Then open GitHub -> Actions -> Deploy BridgeNews to VPS -> Run workflow.

## 7. Normal BridgeNews workflow

- Build and test changes on `development`.
- Merge a completed batch into `main`.
- Manually run the VPS deployment workflow only when production should change.
- Supabase remains unchanged.
- Vercel is no longer required for production hosting.

## Backups and maintenance

Because application data remains in Supabase, the VPS mainly contains application code, Docker images, Caddy TLS state and the production environment file. Back up `.env.production`, keep Ubuntu/Docker patched, and retain access to the GitHub and Supabase projects.
