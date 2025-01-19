import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "DONGE-API",
        description: "test the routes",
    },
    // host: (process.env.BASE_URL as string).split('//')[1] + "/IAM",
    host: (process.env.BASE_URL as string).split('//')[1],
    schemes: ['http', 'https'],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            scheme: 'bearer',
            in: 'header',
            name: 'Authorization',
            bearerFormat: 'JWT',
        },
    },
};

const outputFile = './swagger-output.json';
const routes = ['./index.ts'];

export const generateSwagger = async () => {
    await swaggerAutogen(outputFile, routes, doc);
}