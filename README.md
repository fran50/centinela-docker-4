# Centinela-SmartRiberIA con Docker Compose

Incluye:

- React + Nginx
- Backend Node.js
- MongoDB

## 1. Configuración

```bash
cp .env.example .env
```

Para utilizarlo solo en el mismo ordenador, deja:

```env
PUBLIC_HOST=localhost
```

Para abrir React desde otros equipos de la red, utiliza la IP del servidor Docker:

```env
PUBLIC_HOST=192.168.1.50
```

No escribas `http://` en `PUBLIC_HOST`.

## 2. Construcción y arranque

```bash
docker compose up -d --build
```

## 3. Direcciones

- Aplicación React: http://localhost:8088
- API REST: http://localhost:3001/api/estado
- WebSocket: ws://localhost:8080/meteo
- MongoDB: mongodb://localhost:27017

Sustituye `localhost` por el valor de `PUBLIC_HOST` cuando accedas desde otro equipo.

## 4. Broker MQTT externo

Mosquitto ya no forma parte de este proyecto. Debes tener un broker MQTT ejecutándose fuera de Docker.

Por defecto, el backend se conecta al broker instalado en el equipo anfitrión mediante:

```env
MQTT_BROKER=mqtt://host.docker.internal:1883
MQTT_TOPIC=casa/estacion
```

El simulador MQTT que se ejecuta en el mismo equipo debe publicar en:

```env
MQTT_BROKER=mqtt://127.0.0.1:1883
MQTT_TOPIC=casa/estacion
```

Si el broker está en otro equipo, cambia `MQTT_BROKER` en el `.env` por su IP, por ejemplo:

```env
MQTT_BROKER=mqtt://192.168.1.50:1883
```

## 5. Comandos útiles

Ver contenedores:

```bash
docker compose ps
```

Ver todos los registros:

```bash
docker compose logs -f
```

Ver solamente el backend:

```bash
docker compose logs -f backend
```

Detener:

```bash
docker compose down
```

Detener y eliminar también la base de datos:

```bash
docker compose down -v
```

Reconstruir React después de cambiar `PUBLIC_HOST`:

```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

## 6. Persistencia

MongoDB usa un volumen Docker. Los datos no se pierden al ejecutar `docker compose down`. Solo se eliminan al añadir `-v`.

## 7. Producción

La configuración utiliza un broker MQTT externo y HTTP/WS sin TLS para una red local. Para exponer el sistema a Internet se deben añadir autenticación MQTT, HTTPS/WSS y un proxy inverso.

## Si una compilación anterior falló en `npm ci`

La versión corregida fuerza el registro público de npm y utiliza una imagen Debian estable para Node.
Limpia la caché anterior y reconstruye:

```bash
docker compose down
docker builder prune -f
docker compose build --no-cache backend frontend
docker compose up -d
```

## Autenticación de MongoDB

MongoDB se inicia con estas credenciales por defecto:

```text
Usuario: root
Contraseña: password123
Base de autenticación: admin
```

La cadena usada por el backend dentro de Docker es:

```text
mongodb://root:password123@mongodb:27017/?authSource=admin
```

Desde el equipo anfitrión puedes conectarte con:

```text
mongodb://root:password123@localhost:27017/?authSource=admin
```

Las credenciales pueden cambiarse en `.env` mediante:

```env
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=password123
```

### Importante si MongoDB ya se había iniciado antes

Las variables `MONGO_INITDB_ROOT_USERNAME` y `MONGO_INITDB_ROOT_PASSWORD` solo crean el usuario durante la primera inicialización de un volumen vacío. Si ya existe el volumen anterior sin autenticación, hay que recrearlo:

```bash
docker compose down -v
docker compose up -d --build
```

Este comando borra el histórico guardado en el volumen de MongoDB. Si necesitas conservarlo, exporta antes los datos.
