const { Pool } = require("pg");
const format = require("pg-format");

const pool = new Pool({
  host: "localhost",
  user: "danielamartinez",
  password: "",
  database: "joyas",
  allowExitOnIdle: true,
  port: 5432,
});

const obtenerJoyas = async ({ limits = 6, page = 1, order_by = "id_ASC" }) => {
  try {
    const [campo, direccion] = order_by.split("_");

    const offset = (page - 1) * limits;

    const query = format(
      "SELECT * FROM inventario ORDER BY %s %s LIMIT %s OFFSET %s",
      campo,
      direccion,
      limits,
      offset,
    );

    const { rows: joyas } = await pool.query(query);
    return joyas;
  } catch (error) {
    console.error("Error al obtener joyas:", error);
    throw error;
  }
};

const contarJoyas = async () => {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM inventario");
    return parseInt(rows[0].count);
  } catch (error) {
    console.error("Error al contar joyas:", error);
    throw error;
  }
};

const obtenerJoyasPorFiltros = async ({
  precio_min,
  precio_max,
  categoria,
  metal,
}) => {
  try {
    let filtros = [];
    let values = [];
    let valorIndex = 1;

    const agregarFiltro = (campo, operador, valor) => {
      if (valor !== undefined && valor !== null && valor !== "") {
        values.push(valor);
        filtros.push(`${campo} ${operador} $${valorIndex}`);
        valorIndex++;
      }
    };

    agregarFiltro("precio", ">=", precio_min);
    agregarFiltro("precio", "<=", precio_max);
    agregarFiltro("categoria", "=", categoria);
    agregarFiltro("metal", "=", metal);

    let consulta = "SELECT * FROM inventario";

    if (filtros.length > 0) {
      consulta += ` WHERE ${filtros.join(" AND ")}`;
    }

    const { rows: joyas } = await pool.query(consulta, values);
    return joyas;
  } catch (error) {
    console.error("Error al obtener joyas con filtros:", error);
    throw error;
  }
};

module.exports = { obtenerJoyas, contarJoyas, obtenerJoyasPorFiltros };
