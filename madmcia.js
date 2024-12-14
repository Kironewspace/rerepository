const express = require('express');
const sql = require('mssql');
const path = require('path');

const app = express();
app.use('/img', express.static(path.join(__dirname, 'img')));

const config = {
    user: 'sa',
    password: 'rubbertape',
    server: 'thor',
    database: 'mango',
    options: {
        trustServerCertificate: true
    }
};

// Middleware para parsear los datos del formulario
app.use(express.urlencoded({ extended: true }));

app.get('/madmcia', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query('SELECT admcia_codigo, admcia_nombre, admcia_rnc, admmon_codigo FROM madmcia');
        
        if (result.recordset.length === 0) {
            return res.send('<h1>No se encontraron registros en la tabla madmcia.</h1>');
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
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { width: 80%; margin: 0 auto; padding: 20px; background-color: #fff; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }
                    h1 { text-align: center; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
                    th { background-color: #f2f2f2; }
                    img { max-width: 100%; }
                    .no-image { font-style: italic; color: #888; }
                    .icon-link { text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Datos de la Tabla madmcia</h1>
                    <table>
                        <thead>
                            <tr>`;

        // Mostrar todas las columnas (incluyendo 'admcia_codigo')
        columns.forEach(col => {
            tableHtml += `<th>${col}</th>`;
        });

        // Columna adicional para "Editar"
        tableHtml += `<th>Editar</th>`;
        
        tableHtml += `</tr>
                        </thead>
                        <tbody>`;

        // Generar las filas de la tabla
        result.recordset.forEach(row => {
            tableHtml += '<tr>';
            
            // Mostrar los datos de las columnas (incluyendo 'admcia_codigo')
            columns.forEach(col => {
                const cellValue = row[col];
                tableHtml += `<td>${cellValue || '<span class="no-image">No Disponible</span>'}</td>`;
            });

            // Columna "Editar" con el ícono de lápiz
            tableHtml += `<td class="icon-link">
                            <a href="/editar/admcia/${row['admcia_codigo']}">
                                <img src="/img/pen.png" alt="Editar" width="20" height="20">
                            </a>
                          </td>`;
            
            tableHtml += '</tr>';
        });

        tableHtml += `</tbody>
                </table>
                </div>
            </body>
            </html>`;

        res.send(tableHtml);
    } catch (err) {
        console.error('Error al conectar con la base de datos:', err);
        res.status(500).send('Error en la consulta');
    }
});

// Ruta para mostrar el formulario de edición
app.get('/editar/admcia/:id', async (req, res) => {
    const id = req.params.id;

    try {
        await sql.connect(config);

        const result = await sql.query('SELECT admcia_codigo, admcia_nombre, admcia_rnc, admmon_codigo FROM madmcia WHERE admcia_codigo = @id', {
            id
        });

        if (result.recordset.length === 0) {
            return res.send('<h1>No se encontró el registro.</h1>');
        }

        const row = result.recordset[0];

        let formHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Editar Registro</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f7fc; margin: 0; padding: 0; }
                    h1 { text-align: center; color: #333; margin-top: 40px; }
                    .form-container { width: 100%; max-width: 600px; margin: 30px auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); }
                    .form-container label { display: block; margin-bottom: 8px; font-size: 16px; color: #333; }
                    .form-container input[type="text"] { width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; color: #333; box-sizing: border-box; }
                    .form-container button { width: 100%; padding: 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
                    .form-container button:hover { background-color: #45a049; }
                </style>
            </head>
            <body>
                <h1>Editar Registro</h1>
                <div class="form-container">
                    <form action="/actualizar/admcia/${row.admcia_codigo}" method="POST">
                        <label for="admcia_nombre">Nombre:</label>
                        <input type="text" id="admcia_nombre" name="admcia_nombre" value="${row.admcia_nombre}" required>
                        <br>
                        <label for="admcia_rnc">RNC:</label>
                        <input type="text" id="admcia_rnc" name="admcia_rnc" value="${row.admcia_rnc}" required>
                        <br>
                        <label for="admmon_codigo">Código Moneda:</label>
                        <input type="text" id="admmon_codigo" name="admmon_codigo" value="${row.admmon_codigo}" required>
                        <br>
                        <button type="submit">Actualizar</button>
                    </form>
                </div>
            </body>
            </html>
        `;

        res.send(formHtml);
    } catch (err) {
        console.error('Error al obtener los datos para la edición:', err);
        res.status(500).send('Error en la consulta');
    }
});

// Ruta para procesar la actualización de un registro
app.post('/actualizar/admcia/:id', async (req, res) => {
    const { admcia_nombre, admcia_rnc, admmon_codigo } = req.body;
    const id = req.params.id;

    try {
        await sql.connect(config);
        await sql.query(`
            UPDATE madmcia
            SET admcia_nombre = @nombre, admcia_rnc = @rnc, admmon_codigo = @admmon
            WHERE admcia_codigo = @id`, {
            id,
            nombre: admcia_nombre,
            rnc: admcia_rnc,
            admmon: admmon_codigo
        });

        res.redirect('/madmcia');  // Redirigir a la tabla después de actualizar
    } catch (err) {
        console.error('Error al actualizar el registro:', err);
        res.status(500).send('Error al actualizar los datos');
    }
});

app.listen(3001, () => {
    console.log('Servidor corriendo en http://localhost:3001');
});
