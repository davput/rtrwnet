#!/bin/bash
# ============================================
# RT/RW Net SaaS - Service Management
# ============================================

# Use docker compose or docker-compose
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

case "$1" in
    start)
        echo "Starting all services..."
        $DOCKER_COMPOSE up -d
        ;;
    stop)
        echo "Stopping all services..."
        $DOCKER_COMPOSE down
        ;;
    restart)
        echo "Restarting all services..."
        $DOCKER_COMPOSE restart
        ;;
    logs)
        if [ -z "$2" ]; then
            $DOCKER_COMPOSE logs -f
        else
            $DOCKER_COMPOSE logs -f "$2"
        fi
        ;;
    status)
        echo "Service Status:"
        echo "==============="
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep rtrwnet
        ;;
    rebuild)
        echo "Rebuilding and restarting..."
        $DOCKER_COMPOSE down
        $DOCKER_COMPOSE build --no-cache
        $DOCKER_COMPOSE up -d
        ;;
    db-backup)
        echo "Backing up database..."
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        docker exec rtrwnet-postgres pg_dump -U postgres rtrwnet_saas > "$BACKUP_FILE"
        echo "Backup saved to: $BACKUP_FILE"
        ;;
    db-restore)
        if [ -z "$2" ]; then
            echo "Usage: ./manage.sh db-restore <backup_file.sql>"
            exit 1
        fi
        echo "Restoring database from $2..."
        cat "$2" | docker exec -i rtrwnet-postgres psql -U postgres rtrwnet_saas
        echo "Database restored!"
        ;;
    shell-backend)
        docker exec -it rtrwnet-backend sh
        ;;
    shell-db)
        docker exec -it rtrwnet-postgres psql -U postgres rtrwnet_saas
        ;;
    *)
        echo "RT/RW Net SaaS - Service Management"
        echo ""
        echo "Usage: ./manage.sh <command>"
        echo ""
        echo "Commands:"
        echo "  start         - Start all services"
        echo "  stop          - Stop all services"
        echo "  restart       - Restart all services"
        echo "  logs [name]   - View logs (optional: specific service)"
        echo "  status        - Show service status"
        echo "  rebuild       - Rebuild and restart all services"
        echo "  db-backup     - Backup database"
        echo "  db-restore    - Restore database from backup"
        echo "  shell-backend - Open shell in backend container"
        echo "  shell-db      - Open PostgreSQL shell"
        ;;
esac
