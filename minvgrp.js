const express = require("express");
const sql = require("mssql");
const path = require("path");

const app = express();
app.use("/img", express.static(path.join(__dirname, "img")));

const config = {
  user: "sa",
  password: "rubbertape",
  server: "thor",
  database: "mango",
  options: {
    trustServerCertificate: true,
  },
};

// Mapeo de nombres de columnas
const columnNames = {
  admcia_codigo: "Código Compañía",
  invgrp_codigo: "Código Grupo",
  invgrp_nombre: "Nombre del Grupo",
  admsts_codigo: "Código Estado",
  invfam_codigo: "Código Familia",
};

app.get("/minvgrp", async (req, res) => {
  try {
    await sql.connect(config);
    const result = await sql.query(
      "SELECT admcia_codigo, invgrp_codigo, invgrp_nombre, admsts_codigo, invfam_codigo FROM minvgrp"
    );

    if (result.recordset.length === 0) {
      return res.send(
        "<h1>No se encontraron registros en la tabla minvgrp.</h1>"
      );
    }

    const columns = Object.keys(result.recordset[0]);

    let tableHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Renderizar Tabla Completa</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 80%;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fff;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        text-align: center;
                        color: #333;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border: 1px solid #ddd;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    img {
                        max-width: 100%;
                    }
                    .no-image {
                        font-style: italic;
                        color: #888;
                    }
                    .icon-link {
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Datos de la Tabla minvgrp</h1>
                    <table>
                        <thead>
                            <tr>`;

    // Mostrar las columnas con los nombres amigables (usando el mapeo)
    columns.forEach((col) => {
      tableHtml += `<th>${columnNames[col] || col}</th>`;
    });

    // Columna adicional para "Editar"
    tableHtml += `<th>Editar</th>`;

    tableHtml += `</tr>
                        </thead>
                        <tbody>`;

    // Generar las filas de la tabla
    result.recordset.forEach((row) => {
      tableHtml += "<tr>";

      // Mostrar los datos de las columnas (sin cambios en los datos)
      columns.forEach((col) => {
        const cellValue = row[col];
        tableHtml += `<td>${
          cellValue || '<span class="no-image">No Disponible</span>'
        }</td>`;
      });

      // Columna "Editar" con el ícono de lápiz
      tableHtml += `<td class="icon-link">
                            <a href="/editar/minvgrp/${row["invgrp_codigo"]}">
                                <img src="/img/pen.png" alt="Editar" width="20" height="20">
                            </a>
                          </td>`;

      tableHtml += "</tr>";
    });

    tableHtml += `</tbody>
                </table>
                </div>
            </body>
            </html>`;

    res.send(tableHtml);

    app.get("/editar/minvgrp/:id", async (req, res) => {
      const id = req.params.id; // El id del registro a editar

      try {
        await sql.connect(config);

        const request = new sql.Request();
        request.input("id", sql.VarChar, id);

        const result = await request.query(
          "SELECT admcia_codigo, invgrp_codigo, invgrp_nombre, admsts_codigo, invfam_codigo FROM minvgrp WHERE invgrp_codigo = @id"
        );

        if (result.recordset.length === 0) {
          return res.send("<h1>No se encontró el registro.</h1>");
        }

        const row = result.recordset[0]; // Tomamos el primer registro

        let formHtml = `
                 <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Registro</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f7fc;
            margin: 0;
            padding: 0;
        }

        h1 {
            text-align: center;
            color: #333;
            margin-top: 40px;
        }

        .form-container {
            width: 100%;
            max-width: 600px;
            margin: 30px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .form-container label {
            display: block;
            margin-bottom: 8px;
            font-size: 16px;
            color: #333;
        }

        .form-container input[type="text"] {
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
            color: #333;
            box-sizing: border-box;
        }

        .form-container button {
            width: 100%;
            padding: 12px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
        }

        .form-container button:hover {
            background-color: #45a049;
        }

        .form-container input[type="text"]:focus {
            border-color: #4CAF50;
            outline: none;
        }

        .form-container p {
            text-align: center;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>
    <h1>Editar Registro</h1>
    <div class="form-container">
        <form action="/actualizar/minvgrp/${row.invgrp_codigo}" method="POST">
            <label for="admcia_codigo">Código Compañía:</label>
            <input type="text" id="admcia_codigo" name="admcia_codigo" value="${row.admcia_codigo}" required>

            <label for="invgrp_codigo">Código Grupo:</label>
            <input type="text" id="invgrp_codigo" name="invgrp_codigo" value="${row.invgrp_codigo}" required>

            <label for="invgrp_nombre">Nombre del Grupo:</label>
            <input type="text" id="invgrp_nombre" name="invgrp_nombre" value="${row.invgrp_nombre}" required>

            <label for="admsts_codigo">Código Estado:</label>
            <input type="text" id="admsts_codigo" name="admsts_codigo" value="${row.admsts_codigo}" required>

            <label for="invfam_codigo">Código Familia:</label>
            <input type="text" id="invfam_codigo" name="invfam_codigo" value="${row.invfam_codigo}" required>

            <button type="submit">Actualizar</button>
        </form>
    </div>
</body>
</html>`;

        res.send(formHtml);
      } catch (err) {
        console.error("Error al obtener los datos para la edición:", err);
        res.status(500).send("Error en la consulta");
      }
    });

  } catch (err) {
    console.error("Error al conectar con la base de datos:", err);
    res.status(500).send("Error en la consulta");
  }
});

app.listen(3004, () => {
  console.log("Servidor corriendo en http://localhost:3004/minvgrp");
});
