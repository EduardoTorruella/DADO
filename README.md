# DADO

Aplicación web accesible para registrar transacciones de una comunidad de ahorro usando una interfaz visual y apoyo por voz. El sistema permite guardar movimientos, clasificarlos automáticamente y calcular los saldos principales de forma simple.

## Objetivo del proyecto

DADO está pensado para comunidades donde la administración del dinero puede volverse difícil por el uso de cálculos manuales, registros dispersos o poca familiaridad con interfaces tradicionales. Por eso, este prototipo prioriza:

- uso de íconos y botones visuales,
- apoyo con reconocimiento y respuesta por voz,
- registro rápido de movimientos,
- cálculo automático de saldos,
- validaciones básicas para evitar errores.

## Flujo de valor implementado

El prototipo ya permite un flujo completo y demostrable:

1. Registrar una transacción.
2. Clasificar automáticamente si pertenece al **Fondo Comunal** o a **Rendimiento**.
3. Guardarla en la base de datos.
4. Recalcular y mostrar los saldos actualizados.

Ejemplo:

**registrar ahorro / préstamo / pago / interés → guardar → ver saldo actualizado**

## Funcionalidades actuales

- Registro de transacciones desde una interfaz web.
- Tipos de movimiento soportados:
  - `Depósito`
  - `Préstamo`
  - `Pago_Capital`
  - `Interés`
  - `Multa`
- Clasificación automática por cuenta destino:
  - **Fondo Comunal**
  - **Rendimiento**
- Cálculo automático de:
  - total del fondo comunal,
  - total de rendimientos,
  - gran total en caja.
- Validación de monto mayor a cero.
- Validación de fondos insuficientes al registrar préstamos.
- Interfaz visual con emojis y botones grandes.
- Apoyo de voz:
  - lectura de elementos en pantalla,
  - respuesta por voz,
  - reconocimiento de voz para seleccionar movimientos y monto.

## Tecnologías utilizadas

### Backend
- Node.js
- Express
- SQLite
- sqlite3
- sqlite
- CORS

### Frontend
- HTML5
- CSS3
- JavaScript
- Web Speech API (síntesis de voz y reconocimiento de voz, según compatibilidad del navegador)

## Estructura general del proyecto

```bash
DADO/
├── public/
│   └── index.html
├── database.sqlite
├── server.js
├── package.json
├── package-lock.json
└── .gitignore
```

## Requisitos previos

Antes de correr el proyecto, necesitas tener instalado:

- [Node.js](https://nodejs.org/)
- npm

## Cómo ejecutar el proyecto

1. Clona el repositorio:

```bash
git clone <URL_DEL_REPOSITORIO>
cd DADO
```

2. Instala las dependencias:

```bash
npm install
```

3. Ejecuta el servidor en modo desarrollo:

```bash
npm run dev
```

O en modo normal:

```bash
npm start
```

4. Abre el navegador en:

```bash
http://localhost:3000
```

## Scripts disponibles

```bash
npm start
```
Inicia el servidor normalmente.

```bash
npm run dev
```
Inicia el servidor con recarga al detectar cambios usando `node --watch`.

## Base de datos

El proyecto usa una base de datos SQLite local llamada:

```bash
database.sqlite
```

Cuando el servidor inicia, crea automáticamente la tabla `Transacciones` si todavía no existe.

### Estructura de la tabla

- `id`
- `fecha`
- `tipo_movimiento`
- `monto`
- `cuenta_destino`
- `usuario_id`

## Endpoints disponibles

### `GET /api/saldos`
Devuelve los saldos calculados del sistema.

#### Respuesta de ejemplo

```json
{
  "total_fondo_comunal": 150.00,
  "total_rendimiento": 20.00,
  "gran_total_caja": 170.00
}
```

---

### `POST /api/transacciones`
Registra una nueva transacción.

#### Body de ejemplo

```json
{
  "tipo_movimiento": "Depósito",
  "monto": 100,
  "usuario_id": "Maria"
}
```

#### Tipos válidos

- `Depósito`
- `Préstamo`
- `Pago_Capital`
- `Interés`
- `Multa`

#### Respuesta exitosa de ejemplo

```json
{
  "mensaje": "Transacción registrada con éxito",
  "transaccion": {
    "id": 1,
    "fecha": "2026-03-18T00:00:00.000Z",
    "tipo_movimiento": "Depósito",
    "monto": 100,
    "cuenta_destino": "Fondo Comunal",
    "usuario_id": "Maria"
  }
}
```

## Reglas de negocio implementadas

- Todo movimiento debe tener un monto mayor a cero.
- Los movimientos se clasifican automáticamente según su tipo.
- Un préstamo no puede registrarse si supera el saldo disponible en el fondo comunal.
- Los intereses y multas se suman a rendimientos.
- Los depósitos y pagos a capital afectan el fondo comunal.

## Uso de voz

La interfaz incluye funciones de accesibilidad por voz:

- lectura en voz alta de saldos y elementos,
- confirmación hablada de acciones,
- reconocimiento de voz para comandos sencillos.

Ejemplos que puede reconocer:

- “depósito de 50”
- “préstamo de 20”
- “interés de 10”

> Nota: el reconocimiento de voz depende del navegador y de que el usuario conceda permiso al micrófono.

## Qué se puede mostrar en la demo

Para una demostración rápida, se puede enseñar este flujo:

1. Abrir la aplicación.
2. Consultar los saldos iniciales.
3. Registrar un depósito.
4. Registrar un préstamo.
5. Mostrar cómo cambian automáticamente los saldos.
6. Probar una instrucción por voz.

## Posibles mejoras futuras

- historial completo de transacciones en pantalla,
- separación más visual entre ahorro, préstamos y ganancias,
- identificación de socias con foto o ícono,
- autenticación de usuarios,
- reportes por ciclo,
- despliegue en la nube,
- frontend más completo para dispositivos móviles.

## Autores

Proyecto desarrollado por el equipo DADO.

---

Si vas a presentar este proyecto, una forma simple de describirlo es:

**DADO es un prototipo web accesible que ayuda a registrar movimientos financieros de una comunidad mediante una interfaz visual e interacción por voz, reduciendo errores manuales y mostrando saldos actualizados automáticamente.**
