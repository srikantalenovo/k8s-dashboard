FROM postgres:13-alpine

COPY init.sql /docker-entrypoint-initdb.d/

ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=admin123
ENV POSTGRES_DB=grepmind

EXPOSE 5432
