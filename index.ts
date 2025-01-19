import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { generateSwagger } from './swagger';


const app = express();

(async () => {
    await generateSwagger();
    const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, 'swagger-output.json'), 'utf-8'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
})()

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});