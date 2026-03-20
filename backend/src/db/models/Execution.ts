import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../connection';

interface ExecutionAttributes {
  id: string;
  workflow_id: string;
  workflow_version: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'canceled';
  data: any;
  logs: any[];
  current_step_id?: string | null;
  retries: number;
  triggered_by?: string | null;
  started_at?: Date | null;
  ended_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

interface ExecutionCreationAttributes extends Optional<ExecutionAttributes, 'id' | 'status' | 'logs' | 'current_step_id' | 'retries' | 'triggered_by' | 'started_at' | 'ended_at'> {}

export class Execution extends Model<ExecutionAttributes, ExecutionCreationAttributes> implements ExecutionAttributes {
  declare id: string;
  declare workflow_id: string;
  declare workflow_version: number;
  declare status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'canceled';
  declare data: any;
  declare logs: any[];
  declare current_step_id: string | null;
  declare retries: number;
  declare triggered_by: string | null;
  declare started_at: Date | null;
  declare ended_at: Date | null;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Execution.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workflow_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'workflows',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    workflow_version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'canceled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      defaultValue: {},
      allowNull: false,
    },
    logs: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
    },
    current_step_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    retries: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    triggered_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'executions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);
