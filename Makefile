.PHONY: help install dev start stop restart build clean \
       db-up db-down db-restart db-migrate db-seed db-studio db-reset db-logs \
       setup status lint

# Auto-detect container tool: podman-compose > docker compose
COMPOSE := $(shell command -v podman-compose 2>/dev/null || echo "docker compose")
CONTAINER := $(shell command -v podman 2>/dev/null || echo "docker")

# ============================================================
# Hjälp
# ============================================================

help: ## Visa tillgängliga kommandon
	@echo "Hemmet — BRF-plattform"
	@echo ""
	@echo "Användning: make <kommando>"
	@echo "Container:  $(COMPOSE)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ============================================================
# Applikation
# ============================================================

install: ## Installera dependencies
	npm install

dev: db-up ## Starta dev-server (startar även databasen)
	npm run dev

start: build ## Starta i produktionsläge
	npm run start

stop: ## Stoppa dev-server och databas
	@-pkill -f "next dev" 2>/dev/null || true
	@-pkill -f "next start" 2>/dev/null || true
	$(COMPOSE) down

restart: stop dev ## Starta om allt

build: ## Bygg för produktion
	npm run build

lint: ## Kör linting
	npm run lint

clean: ## Rensa build-artefakter och node_modules
	rm -rf .next node_modules

# ============================================================
# Databas
# ============================================================

db-up: ## Starta PostgreSQL
	$(COMPOSE) up -d
	@echo "Väntar på att PostgreSQL startar..."
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do \
		$(CONTAINER) exec hemmet-db pg_isready -U hemmet > /dev/null 2>&1 && break; \
		sleep 1; \
	done
	@echo "PostgreSQL redo."

db-down: ## Stoppa PostgreSQL
	$(COMPOSE) down

db-restart: db-down db-up ## Starta om PostgreSQL

db-migrate: db-up ## Kör Prisma-migrering
	npx prisma migrate dev --name migration

db-seed: ## Kör seed-script (testdata)
	npx prisma db seed

db-studio: ## Öppna Prisma Studio
	npx prisma studio

db-reset: db-up ## Återställ databasen (radera + migrera + seed)
	npx prisma migrate reset --force

db-logs: ## Visa databasloggar
	$(COMPOSE) logs -f db

# ============================================================
# Första gången
# ============================================================

setup: install db-up db-migrate db-seed ## Fullständig setup (installera, starta db, migrera, seed)
	@echo ""
	@echo "Setup klar! Kör 'make dev' för att starta."
	@echo "Logga in med ordforande@hemmet.se / password123"

# ============================================================
# Status
# ============================================================

status: ## Visa status för app och databas
	@echo "=== Databas ==="
	@$(COMPOSE) ps 2>/dev/null || echo "Ej tillgängligt"
	@echo ""
	@echo "=== Next.js ==="
	@ps aux | grep "[n]ext dev" | head -1 || echo "Dev-server körs inte"
	@ps aux | grep "[n]ext start" | head -1 || echo "Prod-server körs inte"
