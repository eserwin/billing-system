import { Sequelize } from 'sequelize';
import config from '../config/database';

const env = (process.env.NODE_ENV || 'development') as keyof typeof config;
const dbConfig = config[env];

const sequelize = new Sequelize({
  ...dbConfig,
});

export { sequelize };
export default sequelize;
