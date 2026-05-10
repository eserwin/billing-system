import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

interface InternetPlanAttributes {
  id: string;
  name: string;
  speed: string;
  monthly_fee: number;
  installation_fee: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

interface InternetPlanCreationAttributes extends Optional<InternetPlanAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at' | 'deleted_at'> {}

class InternetPlan extends Model<InternetPlanAttributes, InternetPlanCreationAttributes> implements InternetPlanAttributes {
  declare id: string;
  declare name: string;
  declare speed: string;
  declare monthly_fee: number;
  declare installation_fee: number;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

InternetPlan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    speed: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    monthly_fee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Stored in centavos',
    },
    installation_fee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Stored in centavos',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'internet_plans',
    modelName: 'InternetPlan',
  }
);

export default InternetPlan;
export { InternetPlanAttributes, InternetPlanCreationAttributes };
