import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface WorkflowAttributes {
  id: string;
  name: string;
  version: number;
  is_active: boolean;
  input_schema: any;
  start_step_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface WorkflowCreationAttributes extends Optional<WorkflowAttributes, 'id' | 'version' | 'is_active' | 'start_step_id'> {}

export class Workflow extends Model<WorkflowAttributes, WorkflowCreationAttributes> implements WorkflowAttributes {
  declare id: string;
  declare name: string;
  declare version: number;
  declare is_active: boolean;
  declare input_schema: any;
  declare start_step_id: string | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Workflow.init(
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
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    input_schema: {
      type: DataTypes.JSON,
      defaultValue: {},
      allowNull: false,
    },
    start_step_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'workflows',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
