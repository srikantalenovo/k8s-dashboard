# Makefile for Docker Compose cleanup & rebuild

# Default service file (change if your compose file has a different name)
COMPOSE_FILE = docker-compose.yml

# Rebuild everything from scratch
rebuild:
	@echo "🚀 Cleaning up all containers, images, volumes, and networks..."
	docker-compose -f $(COMPOSE_FILE) down --rmi all --volumes --remove-orphans
	@echo "🧹 Removing build cache..."
	docker builder prune -a --force
	@echo "🔨 Building fresh images (no cache)..."
	docker-compose -f $(COMPOSE_FILE) build --no-cache
	@echo "▶️ Starting containers..."
	docker-compose -f $(COMPOSE_FILE) up --force-recreate

# Just clean without rebuilding
clean:
	@echo "🧹 Cleaning containers, images, and volumes..."
	docker-compose -f $(COMPOSE_FILE) down --rmi all --volumes --remove-orphans
	docker builder prune -a --force

# Just build without cache
build:
	@echo "🔨 Building fresh images..."
	docker-compose -f $(COMPOSE_FILE) build --no-cache

# Start fresh containers
up:
	@echo "▶️ Starting containers..."
	docker-compose -f $(COMPOSE_FILE) up --force-recreate
