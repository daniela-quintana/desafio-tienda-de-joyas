const express = require("express");
const cors = require("cors");
const {
  obtenerJoyas,
  contarJoyas,
  obtenerJoyasPorFiltros,
} = require("./consultas");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const reporteMiddleware = (req, res, next) => {
  const fecha = new Date().toISOString();
  const { method, url } = req;
  console.log(`[${fecha}] ${method} ${url} - Consulta recibida`);
  next();
};

app.use(reporteMiddleware);

app.get("/", (req, res) => {
  res.send("API de Tienda de Joyas 🚀");
});

app.get("/joyas", async (req, res) => {
  try {
    const { limits = 6, page = 1, order_by = "id_ASC" } = req.query;

    if (isNaN(limits) || limits <= 0) {
      return res
        .status(400)
        .json({ error: "El parámetro 'limits' debe ser un número positivo" });
    }
    if (isNaN(page) || page <= 0) {
      return res
        .status(400)
        .json({ error: "El parámetro 'page' debe ser un número positivo" });
    }

    const joyas = await obtenerJoyas({ limits, page, order_by });
    const totalJoyas = await contarJoyas();

    const totalPages = Math.ceil(totalJoyas / limits);

    const results = joyas.map((joya) => ({
      nombre: joya.nombre,
      categoria: joya.categoria,
      metal: joya.metal,
      precio: joya.precio,
      stock: joya.stock,
      href: `http://localhost:${PORT}/joyas/${joya.id}`,
    }));

    const BASE_URL = `http://localhost:${PORT}/joyas`;

    const HATEOAS = {
      total: totalJoyas,
      totalPages: totalPages,
      page: parseInt(page),
      limit: parseInt(limits),
      results: results,
      next:
        totalPages > page
          ? `${BASE_URL}?limits=${limits}&page=${parseInt(page) + 1}&order_by=${order_by}`
          : null,
      previous:
        page > 1
          ? `${BASE_URL}?limits=${limits}&page=${parseInt(page) - 1}&order_by=${order_by}`
          : null,
    };

    res.json(HATEOAS);
  } catch (error) {
    console.error("Error en GET /joyas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/joyas/filtros", async (req, res) => {
  try {
    const { precio_min, precio_max, categoria, metal } = req.query;

    const joyasFiltradas = await obtenerJoyasPorFiltros({
      precio_min,
      precio_max,
      categoria,
      metal,
    });

    if (joyasFiltradas.length === 0) {
      return res.status(404).json({
        error: "No se encontraron joyas con los filtros especificados",
        filtros: { precio_min, precio_max, categoria, metal },
      });
    }

    const results = joyasFiltradas.map((joya) => ({
      id: joya.id,
      nombre: joya.nombre,
      categoria: joya.categoria,
      metal: joya.metal,
      precio: joya.precio,
      stock: joya.stock,
      href: `http://localhost:${PORT}/joyas/${joya.id}`,
    }));

    res.json({
      total: joyasFiltradas.length,
      filtros_aplicados: { precio_min, precio_max, categoria, metal },
      results,
    });
  } catch (error) {
    console.error("Error en GET /joyas/filtros:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
