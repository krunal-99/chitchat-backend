import { DataSource } from "typeorm";
import dotenv from "dotenv";
dotenv.config();
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

export const AppDataSource = new DataSource({
  type: "postgres",
  database: PGDATABASE,
  host: PGHOST,
  password: PGPASSWORD,
  username: PGUSER,
  port: 5432,
  synchronize: true,
  entities: ["./src/entities/*.ts", "./dist/entities/*.js"],
  ssl: {
    rejectUnauthorized: false,
  },
});
